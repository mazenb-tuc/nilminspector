from typing import List

from pydantic import BaseModel, ConfigDict
import enilm.yaml.data

from . import RawDataDict


class PredictParams(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    data: RawDataDict
    app_name: enilm.yaml.data.Label
    model_exp_name: str
    gt: RawDataDict | None = None  # ground truth data to compute errors


class PredictionError(BaseModel):
    name: str
    value: float
    unit: str


class PredictResponse(BaseModel):
    pred: RawDataDict
    errors: List[PredictionError] | None = None
