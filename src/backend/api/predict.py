from fastapi import APIRouter
from celery.result import AsyncResult
import pydantic
from pydantic import BaseModel

from ..pred import pred
from ..types.pred import PredictParams, PredictResponse
from ..types.tasks import CeleryTaskId, TaskState
from ..types.tasks.pred import PredProgressResponse, PredProgressMsg


router = APIRouter(prefix="/predict")


@router.post("/")
async def predict(predict_params: PredictParams) -> PredictResponse:
    # sync
    pred_res = pred(predict_params)
    assert isinstance(pred_res, PredictResponse)
    return pred_res


class AsyncResponse(BaseModel):
    task_id: CeleryTaskId


@router.post("/async")
async def async_predict(predict_params: PredictParams) -> AsyncResponse:
    pred_task = pred(predict_params, sync=False)
    assert isinstance(pred_task, AsyncResult)
    assert isinstance(pred_task.id, str)
    return AsyncResponse(task_id=pred_task.id)


@router.get("/async/progress/{task_id}")
async def predict_progress(task_id: str) -> PredProgressResponse:
    pred_task = AsyncResult(task_id)
    pred_state_enum = TaskState(pred_task.state.upper())

    try:
        msg = PredProgressMsg.model_validate_json(pred_task.info)
    except pydantic.ValidationError:
        msg = PredProgressMsg(percentage=100)
    
    return PredProgressResponse(
        state=pred_state_enum,
        msg=msg,
    )


@router.get("/async/results/{task_id}")
async def predict_results(task_id: str) -> PredictResponse:
    pred_task = AsyncResult(task_id)
    return PredictResponse.model_validate_json(pred_task.result)
