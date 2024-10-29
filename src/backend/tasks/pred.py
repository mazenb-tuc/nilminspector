import importlib

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
import enilm.norm

from .celery import app
from .. import metrics
from .. import exps
from ..utils import get_device
from ..model import get_model_for_exp
from ..types import RawDataDict
from ..types.tasks import TaskState
from ..types.pred import PredictParams, PredictResponse, PredictionError
from ..types.tasks.pred import PredProgressMsg


def get_exp_ds_class(exp: exps.ModelExp):
    ds_class_path = ".".join(exp.ds_class.split(".")[:-1])
    ds_class_name = exp.ds_class.split(".")[-1]
    module = importlib.import_module(ds_class_path)
    clazz = getattr(module, ds_class_name)
    return clazz


@app.task(name="pred", bind=True)
def pred(self, predict_params_json: str) -> str:
    predict_params: PredictParams = PredictParams.model_validate_json(
        predict_params_json
    )
    if self:
        self.update_state(
            state=TaskState.STARTED,
            meta=PredProgressMsg(percentage=0).model_dump_json(),
        )

    exp: exps.ModelExp = exps.get_model_exp_by_name(predict_params.model_exp_name)
    device: torch.device = get_device()
    model: nn.Module = get_model_for_exp(predict_params.model_exp_name, device)

    # set the model to evaluation mode i.e. disabling dropout and using population statistics for batch normalization
    model.eval()

    # convert data to expected format
    data_np: np.ndarray = np.array(list(predict_params.data.values()), dtype=np.float32)

    # normalize data
    data_normalized = np.array(enilm.norm.normalize(data_np, exp.mains_norm_params))

    # number of iter over data_loader for progress
    n_iter = len(data_normalized) / exp.batch_size
    n_iter = np.ceil(
        n_iter
    )  # to avoid cases where n_iter becomes zero due to small data size, since it used as the divisor below

    # put data into loader
    data_loader = DataLoader(
        get_exp_ds_class(exp)(
            mains=data_normalized,
            sequence_length=exp.sequence_length,
            reshape=True,
            pad=True,
        ),
        batch_size=exp.batch_size,
        shuffle=False,
    )

    # generate predictions
    preds = []
    for inputs in data_loader:
        inputs = inputs.to(device)
        preds.append(model(inputs).cpu().detach().numpy().flatten())
        if self:
            progress_percentage = int(len(preds) / n_iter * 100)
            if progress_percentage > 100:
                progress_percentage = 100
            self.update_state(
                state=TaskState.RUNNING,
                meta=PredProgressMsg(percentage=progress_percentage).model_dump_json(),
            )
    preds = np.concatenate(preds)
    preds_flat_denorm: np.ndarray = np.array(
        enilm.norm.denormalize(preds, exp.app_norm_params)
    )

    if self:
        self.update_state(
            state=TaskState.FINISHED,
            meta=PredProgressMsg(percentage=100).model_dump_json(),
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
                value=metrics.f1_score(
                    gt_np, preds_flat_denorm, exp.on_power_threshold
                ),
                unit="",
            )
        )

        return PredictResponse(pred=pred_ts, errors=errors).model_dump_json()

    return PredictResponse(pred=pred_ts).model_dump_json()
