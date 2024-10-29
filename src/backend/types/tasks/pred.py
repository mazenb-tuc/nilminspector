from . import TaskState

from pydantic import BaseModel


class PredProgressMsg(BaseModel):
    percentage: int = 0  # 0 to 100


class PredProgressResponse(BaseModel):
    state: TaskState
    msg: PredProgressMsg
