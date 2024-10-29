import hashlib

import joblib
from celery.result import AsyncResult

import enilm.norm
import enilm.etypes
import enilm.models.torch.utils
import enilm.yaml.data

from .data import get_data
from .mem import cache_folder, joblib_verbose
from .types.pred import PredictResponse, PredictParams
from .tasks.pred import pred as pred_task


def pred(
    pred_params: PredictParams,
    sync: bool = True,
    no_cache: bool = False,
) -> PredictResponse | AsyncResult:
    # to json for the task
    pred_params_json = pred_params.model_dump_json()

    # memory with hashed pred_params
    pred_params_hash = hashlib.sha256(pred_params_json.encode()).hexdigest()
    memory: joblib.Memory = joblib.Memory(
        cache_folder / "pred" / pred_params_hash, verbose=joblib_verbose
    )

    def _pred(pred_params_json: str) -> PredictResponse:
        task = pred_task.delay(pred_params_json)
        res_json = task.get()
        return PredictResponse.model_validate_json(res_json)

    if sync:
        if no_cache:
            return _pred(pred_params_json)
        if not no_cache:
            res = memory.cache(_pred)(pred_params_json)
            assert isinstance(res, PredictResponse)
            return res

    if not sync:  # async -> cache is not used
        task = pred_task.delay(pred_params_json)
        return task

    raise ValueError("Invalid sync value")


def full_pred(
    data_exp_name: str,
    app_name: enilm.etypes.AppName,
    model_exp_name: str | None = None,
) -> PredictResponse:
    # if model_exp_name is not provided, use data_exp_name
    if model_exp_name is None:
        model_exp_name = data_exp_name

    memory: joblib.Memory = joblib.Memory(
        cache_folder / "full_pred" / data_exp_name / model_exp_name, verbose=1
    )

    @memory.cache
    def full_pred_cached(data_exp_name: str, model_exp_name: str) -> PredictResponse:
        """Generate predictions for all the original mains data"""
        data = get_data(data_exp_name).overlapping_data
        predict_params_all: PredictParams = PredictParams(
            data=data["mains"].to_dict(),
            app_name=app_name,
            gt=data[app_name].to_dict(),
            model_exp_name=model_exp_name,
        )

        pred_res = pred(predict_params_all)
        assert isinstance(pred_res, PredictResponse)
        return pred_res

    return full_pred_cached(data_exp_name, model_exp_name)
