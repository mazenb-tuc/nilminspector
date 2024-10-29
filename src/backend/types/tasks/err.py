from typing import List

from pydantic import BaseModel
import enilm.etypes

from . import TaskState
from ..pred import PredictResponse
from ..err import ErrType


class ComputeErrTaskParams(BaseModel):
    exp_name: str
    app_name: enilm.etypes.AppName
    err_type: ErrType
    seq_len: int
    on_power_threshold: float
    full_pred: PredictResponse


class ComputeErrTaskResult(BaseModel):
    errors: List[float]


class ComputeErrProgressMsg(BaseModel):
    percentage: int = 0  # 0 to 100


class ComputerErrProgressResponse(BaseModel):
    state: TaskState
    msg: ComputeErrProgressMsg
