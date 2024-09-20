from typing import List, Optional
from enum import Enum

import joblib
from pydantic import BaseModel
from fastapi import APIRouter
import numpy as np
from loguru import logger

import enilm.etypes

from ..model import full_pred
from ..types import RawDataDict
from ..mem import get_exp_mem, cache_folder
from ..data import get_data
from .. import exps
from .. import metrics


router = APIRouter(prefix="/err")


class ErrType(Enum):
    MAE = "MAE"
    F1 = "F1"


@router.get("/types")
async def getErrTypes() -> List[str]:
    return [err_type.value for err_type in ErrType]


def compute_errors(
    exp_name: str,
    app_name: enilm.etypes.AppName,
    err_type: ErrType = ErrType.MAE,
) -> List[float]:
    memory: joblib.Memory = get_exp_mem(exp_name).memory
    exp: exps.Exp = exps.get_exp_by_name(exp_name)

    @memory.cache()
    def compute_errors_cached(
        exp_name: str,
        app_name: enilm.etypes.AppName,
        err_type: ErrType = ErrType.MAE,
    ) -> List[float]:
        data = get_data(exp_name).overlapping_data
        gt_np = np.array(list(data[app_name]), dtype=np.float32)

        pred_all = full_pred(exp_name, app_name)
        pr_np = np.array(list(pred_all.pred.values()), dtype=np.float32)

        errors: List[float] = []
        for wind_start in range(0, gt_np.size - exp.sequence_length):
            gt_np_wind = gt_np[wind_start : wind_start + exp.sequence_length]
            pr_np_wind = pr_np[wind_start : wind_start + exp.sequence_length]

            if err_type is ErrType.MAE:
                errors.append(float(np.mean(np.abs(pr_np_wind - gt_np_wind))))
            elif err_type is ErrType.F1:
                gt_np_wind_on = gt_np_wind > exp.on_power_threshold
                pr_np_wind_on = pr_np_wind > exp.on_power_threshold

                TP = np.sum((gt_np_wind_on == 1) & (pr_np_wind_on == 1))
                FP = np.sum((gt_np_wind_on == 0) & (pr_np_wind_on == 1))
                FN = np.sum((gt_np_wind_on == 1) & (pr_np_wind_on == 0))
                precision = TP / (TP + FP) if (TP + FP) > 0 else 0
                recall = TP / (TP + FN) if (TP + FN) > 0 else 0
                f1_score = (
                    0
                    if precision + recall == 0
                    else 2 * (precision * recall) / (precision + recall)
                )
                errors.append(float(f1_score))

        return errors

    return compute_errors_cached(exp_name, app_name, err_type)


class ErrHistParams(BaseModel):
    data_exp_name: str
    app_name: enilm.etypes.AppName
    err_type: ErrType
    bins: int


class ErrHistResponse(BaseModel):
    hist: List[int]
    bin_edges: List[float]
    unit: str


@router.post("/hist")
async def getErrHist(params: ErrHistParams) -> ErrHistResponse:
    errors = compute_errors(params.data_exp_name, params.app_name, params.err_type)
    hist, bin_edges = np.histogram(errors, bins=params.bins)

    return ErrHistResponse(hist=hist.tolist(), bin_edges=bin_edges.tolist(), unit="W")


class RndDataWithErrParams(BaseModel):
    data_exp_name: str
    app_name: enilm.etypes.AppName
    err_type: ErrType
    err_min: float
    err_max: float
    duration_samples: int


class RndDataWithErrResponse(BaseModel):
    data: Optional[RawDataDict]
    err: bool
    err_msg: str


@router.post("/rnd_data_with_err")
async def getRndDataWithErr(params: RndDataWithErrParams) -> RndDataWithErrResponse:
    errors = compute_errors(params.data_exp_name, params.app_name, params.err_type)

    # match each error to the window idx
    err_wind_idx = [(idx, errors[idx]) for idx in range(len(errors))]

    # shuffle the error window idx
    np.random.shuffle(err_wind_idx)

    # find the first error window idx that is within the range
    for wind_idx, err in err_wind_idx:
        if params.err_min <= err <= params.err_max:
            break
    if wind_idx == len(errors) - 1:
        return RndDataWithErrResponse(
            data=None, err=True, err_msg="No error window found"
        )

    # return the corresponding window of data
    data = get_data(params.data_exp_name).overlapping_data
    exp: exps.Exp = exps.get_exp_by_name(params.data_exp_name)
    wind_size = (
        exp.sequence_length
        if params.duration_samples < exp.sequence_length
        else params.duration_samples
    )
    data_slice = data[params.app_name][wind_idx : wind_idx + wind_size]
    data_dict = data_slice.to_dict()
    return RndDataWithErrResponse(data=data_dict, err=False, err_msg="")


class TotalErrParams(BaseModel):
    err_type: ErrType
    data_exp_name: str
    app_name: enilm.etypes.AppName
    model_exp_name: str


class TotalErrResponse(BaseModel):
    train_err: float
    test_err: float
    total_err: float
    err_unit: str


@router.post("/total_err")
async def getTotalErr(params: TotalErrParams) -> TotalErrResponse:
    memory: joblib.Memory = joblib.Memory(cache_folder / "total_err", verbose=1)

    @memory.cache()
    def cached(params: TotalErrParams) -> TotalErrResponse:
        logger.info("Computing total error")
        data = get_data(params.data_exp_name).overlapping_data
        gt_np = np.array(list(data[params.app_name]), dtype=np.float32)

        pred_all = full_pred(
            params.data_exp_name, params.app_name, params.model_exp_name
        )
        pr_np = np.array(list(pred_all.pred.values()), dtype=np.float32)

        model_exp: exps.Exp = exps.get_exp_by_name(params.model_exp_name)
        selected_train_percent: float = model_exp.selected_train_percent
        train_size = int(selected_train_percent * gt_np.size)

        if params.err_type is ErrType.MAE:
            logger.info("Computing MAE")
            return TotalErrResponse(
                train_err=metrics.mae(gt_np[:train_size], pr_np[:train_size]),
                test_err=metrics.mae(gt_np[train_size:], pr_np[train_size:]),
                total_err=metrics.mae(gt_np, pr_np),
                err_unit="W",
            )
        elif params.err_type is ErrType.F1:
            logger.info("Computing F1")
            return TotalErrResponse(
                train_err=metrics.f1_score(gt_np[:train_size], pr_np[:train_size]),
                test_err=metrics.f1_score(gt_np[train_size:], pr_np[train_size:]),
                total_err=metrics.f1_score(gt_np, pr_np),
                err_unit="",
            )

        raise ValueError(f"Unknown error type: {params.err_type}")

    return cached(params)
