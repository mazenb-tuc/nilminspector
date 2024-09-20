from typing import List

import joblib
import numpy as np
from pydantic import BaseModel

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

import enilm.norm
import enilm.etypes
import enilm.yaml.data
import enilm.models.torch.utils

from . import exps
from . import metrics
from .consts import selected_gpu
from .types import RawDataDict
from .data import get_data
from .mem import get_exp_mem, cache_folder


# check if CUDA is available
device = torch.device("cpu")
if torch.cuda.is_available():
    device = torch.device(f"cuda:{selected_gpu}")
elif torch.backends.mps.is_available():
    device = torch.device("mps")
print(f"Using device: {device}")


class PredictParams(BaseModel):
    data: RawDataDict
    app_name: enilm.yaml.data.Label
    gt: RawDataDict | None = None  # ground truth data to compute errors
    model_exp_name: str


class PredictionError(BaseModel):
    name: str
    value: float
    unit: str


class PredictResponse(BaseModel):
    pred: RawDataDict
    errors: List[PredictionError] | None = None


def get_model_for_exp(exp_name: str) -> nn.Module:
    exp: exps.Exp = exps.get_exp_by_name(exp_name)

    # moving model to device
    if exp.model_name == "S2P":
        from enilm.models.torch import S2P

        model = S2P(exp.sequence_length).to(device)
    else:
        raise NotImplementedError(f"Model {exp.model_name} is not implemented")

    # loading model weights
    full_models_weights_path = (
        get_exp_mem(exp_name).models_cache_path / exp.selected_model_weights
    )
    model.load_state_dict(torch.load(full_models_weights_path))

    return model


def get_model_dataset(exp: exps.Exp, predict_params: PredictParams) -> Dataset:
    if exp.model_name == "S2P":
        from enilm.models.torch import S2PDatasetMains

        # convert data to expected format
        data_np: np.ndarray = np.array(
            list(predict_params.data.values()), dtype=np.float32
        )

        # normalize data
        data_normalized = np.array(enilm.norm.normalize(data_np, exp.mains_norm_params))

        return S2PDatasetMains(
            mains=data_normalized,
            sequence_length=exp.sequence_length,
            reshape=True,
            pad=True,
        )
    else:
        raise NotImplementedError(f"Model {exp.model_name} is not implemented")


def pred(predict_params: PredictParams) -> PredictResponse:
    exp: exps.Exp = exps.get_exp_by_name(predict_params.model_exp_name)
    model = get_model_for_exp(predict_params.model_exp_name)
    assert isinstance(model, nn.Module)

    # set the model to evaluation mode i.e. disabling dropout and using population statistics for batch normalization
    model.eval()

    # put data into loader
    data_loader = DataLoader(
        get_model_dataset(exp, predict_params),
        batch_size=exp.batch_size,
        shuffle=False,
    )

    # generate predictions
    preds = []
    for inputs in data_loader:
        inputs = inputs.to(device)
        preds.append(model(inputs).cpu().detach().numpy().flatten())
    preds = np.concatenate(preds)
    preds_flat_denorm: np.ndarray = np.array(
        enilm.norm.denormalize(preds, exp.app_norm_params)
    )

    # add timestamps
    pred_ts: RawDataDict = {
        ts: pred for ts, pred in zip(predict_params.data.keys(), preds_flat_denorm)
    }

    # compute errors if gt is provided
    if predict_params.gt is not None:
        errors = []
        gt_np: np.ndarray = np.array(list(predict_params.gt.values()), dtype=np.float32)

        # MAE
        errors.append(
            PredictionError(
                name="MAE",
                value=metrics.mae(gt_np, preds_flat_denorm),
                unit="W",
            )
        )

        # F1
        errors.append(
            PredictionError(
                name="F1",
                value=metrics.f1_score(gt_np, preds_flat_denorm, exp.on_power_threshold),
                unit="",
            )
        )

        return PredictResponse(pred=pred_ts, errors=errors)

    return PredictResponse(pred=pred_ts)


def full_pred(
    data_exp_name: str,
    app_name: enilm.etypes.AppName,
    model_exp_name: str | None = None,
):
    # if model_exp_name is not provided, use data_exp_name
    if model_exp_name is None:
        model_exp_name = data_exp_name

    memory: joblib.Memory = joblib.Memory(
        cache_folder / "full_pred" / data_exp_name / model_exp_name, verbose=1
    )

    @memory.cache()
    def full_pred_cached(data_exp_name: str, model_exp_name: str) -> PredictResponse:
        """Generate predictions for all the original mains data"""
        data = get_data(data_exp_name).overlapping_data
        predict_params_all: PredictParams = PredictParams(
            data=data["mains"].to_dict(),
            app_name=app_name,
            gt=data[app_name].to_dict(),
            model_exp_name=model_exp_name,
        )
        return pred(predict_params_all)

    return full_pred_cached(data_exp_name, model_exp_name)
