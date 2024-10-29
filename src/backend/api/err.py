from typing import List, Optional, Dict

import joblib
from pydantic import BaseModel, ConfigDict
from fastapi import APIRouter
import numpy as np
from loguru import logger
from celery.result import AsyncResult

import enilm.etypes

from .. import exps
from .. import metrics
from .. import apps
from ..pred import full_pred
from ..mem import get_exp_mem, cache_folder
from ..data import get_data
from ..tasks.err import compute_errors as compute_errors_task

from .. import types
from ..types.err import ErrType
from ..types.tasks.err import ComputeErrTaskParams, ComputeErrTaskResult


router = APIRouter(prefix="/err")


higher_better: Dict[ErrType, bool] = {
    ErrType.MAE: False,
    ErrType.F1: True,
}


@router.get("/types")
async def getErrTypes() -> List[str]:
    return [err_type.value for err_type in ErrType]


@router.get("/higher_better")
async def getHigherBetter() -> Dict[str, bool]:
    return {err_type.value: higher_better[err_type] for err_type in ErrType}


def compute_errors(
    exp_name: str,
    app_name: enilm.etypes.AppName,
    err_type: ErrType = ErrType.MAE,
    sync: bool = True,
    no_cache: bool = False,
) -> ComputeErrTaskResult | AsyncResult:
    memory: joblib.Memory = get_exp_mem(exp_name).memory
    exp: exps.ModelExp = exps.get_model_exp_by_name(exp_name)

    data = get_data(exp_name).overlapping_data
    matched_app_name = apps.find_matching_app_name_in_data_keys(
        exp_name,
        app_name,
        data.keys(),
    )
    pred_all = full_pred(
        data_exp_name=exp_name,
        app_name=matched_app_name,
    )

    # to json for the task
    params_json: str = ComputeErrTaskParams(
        exp_name=exp_name,
        app_name=app_name,
        err_type=err_type,
        seq_len=exp.sequence_length,
        on_power_threshold=exp.on_power_threshold,
        full_pred=pred_all,
    ).model_dump_json()

    def _compute_errors(params_json: str) -> ComputeErrTaskResult:
        task = compute_errors_task.delay(params_json)
        res_json = task.get()
        return ComputeErrTaskResult.model_validate_json(res_json)

    if sync:
        if no_cache:
            return _compute_errors(params_json)
        if not no_cache:
            res = memory.cache(_compute_errors)(params_json)
            assert isinstance(res, ComputeErrTaskResult)
            return res

    if not sync:
        task = compute_errors_task.delay(params_json)
        return task

    raise ValueError("Invalid sync value")


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
    errors_res = compute_errors(
        exp_name=params.data_exp_name,
        app_name=params.app_name,
        err_type=params.err_type,
    )
    assert isinstance(errors_res, ComputeErrTaskResult)
    errors = errors_res.errors
    hist, bin_edges = np.histogram(errors, bins=params.bins)

    return ErrHistResponse(hist=hist.tolist(), bin_edges=bin_edges.tolist(), unit="W")


class RndDateWithErrParams(BaseModel):
    exp_name: str
    app_name: enilm.etypes.AppName
    err_type: ErrType
    err_min: float
    err_max: float
    duration_samples: int


class RndDateWithErrResponse(BaseModel):
    err: bool = False
    err_msg: str = ""
    start_date: Optional[types.PDTimestamp] = None
    end_date: Optional[types.PDTimestamp] = None
    duration_samples: Optional[int] = None


@router.post("/rnd_date_with_err")
async def getRndDateWithErr(params: RndDateWithErrParams) -> RndDateWithErrResponse:
    # ensure that the selected exp has a model
    if not isinstance(exps.get_exp_by_name(params.exp_name), exps.ModelExp):
        raise ValueError("The selected exp does not have a model!")

    errors_res = compute_errors(
        exp_name=params.exp_name,
        app_name=params.app_name,
        err_type=params.err_type,
    )
    assert isinstance(errors_res, ComputeErrTaskResult)
    errors = errors_res.errors

    # match each error to the window idx
    err_wind_idx = [(idx, errors[idx]) for idx in range(len(errors))]

    # shuffle the error window idx
    np.random.shuffle(err_wind_idx)

    # find the first error window idx that is within the range
    for wind_idx, err in err_wind_idx:
        if params.err_min <= err <= params.err_max:
            break
    if wind_idx == len(errors) - 1:
        return RndDateWithErrResponse(err=True, err_msg="No error window found")

    # return the corresponding window of data
    exp: exps.ModelExp = exps.get_model_exp_by_name(params.exp_name)
    wind_size = (
        exp.sequence_length
        if params.duration_samples < exp.sequence_length
        else params.duration_samples
    )

    data = get_data(params.exp_name).overlapping_data
    matched_app_name = apps.find_matching_app_name_in_data_keys(
        params.exp_name,
        params.app_name,
        data.keys(),
    )
    app_data = data[matched_app_name]

    if not ((app_data.size - exp.sequence_length) == len(errors)):
        raise ValueError(
            "Number of computed errors does not match the number of windows! Something is gone wrong!!!"
        )

    return RndDateWithErrResponse(
        start_date=app_data.index[wind_idx],  # type: ignore
        end_date=app_data.index[wind_idx + wind_size],  # type: ignore
        duration_samples=wind_size,  # note: this may be different from params.duration_samples
    )


class TotalErrParams(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
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

    @memory.cache
    def cached(params: TotalErrParams) -> TotalErrResponse:
        logger.info("Computing total error")
        data = get_data(params.data_exp_name).overlapping_data
        matched_app_name = apps.find_matching_app_name_in_data_keys(
            params.data_exp_name,
            params.app_name,
            data.keys(),
        )
        data_exp: exps.Exp = exps.get_exp_by_name(params.data_exp_name)
        gt_np = np.array(list(data[matched_app_name]), dtype=np.float32)

        pred_all = full_pred(
            data_exp_name=params.data_exp_name,
            app_name=matched_app_name,
            model_exp_name=params.model_exp_name,
        )
        pr_np = np.array(list(pred_all.pred.values()), dtype=np.float32)

        model_exp: exps.ModelExp = exps.get_model_exp_by_name(params.model_exp_name)
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
                train_err=metrics.f1_score(
                    gt_np[:train_size], pr_np[:train_size], data_exp.on_power_threshold
                ),
                test_err=metrics.f1_score(
                    gt_np[train_size:], pr_np[train_size:], data_exp.on_power_threshold
                ),
                total_err=metrics.f1_score(gt_np, pr_np, data_exp.on_power_threshold),
                err_unit="",
            )

        raise ValueError(f"Unknown error type: {params.err_type}")

    return cached(params)
