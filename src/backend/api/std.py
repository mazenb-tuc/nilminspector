import joblib
import numpy as np
from fastapi import APIRouter
from pydantic import BaseModel

import enilm.etypes

from ..mem import cache_folder
from ..data import get_data

router = APIRouter(prefix="/std")


class StdWattsParams(BaseModel):
    std_threshold: float
    data_exp_name: str
    app_name: enilm.etypes.AppName


class StdWattsResponse(BaseModel):
    lower: float
    upper: float
    mean: float
    std: float


@router.post("/watts")
async def getStdWatts(params: StdWattsParams) -> StdWattsResponse:
    memory: joblib.Memory = joblib.Memory(cache_folder / "std_watts", verbose=1)

    @memory.cache
    def get_std_watts(params: StdWattsParams) -> StdWattsResponse:
        data = get_data(params.data_exp_name).resampled_data
        assert params.app_name in data
        data = data[params.app_name]

        mean_data = np.mean(data)
        std_data = np.std(data)
        return StdWattsResponse(
            lower=float(mean_data - params.std_threshold * std_data),
            upper=float(mean_data + params.std_threshold * std_data),
            mean=float(mean_data),
            std=float(std_data),
        )

    return get_std_watts(params)
