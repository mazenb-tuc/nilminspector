from fastapi import APIRouter
import pandas as pd
from pydantic import BaseModel

import enilm.yaml.data

from ..data import get_data
from ..config import get_config
from ..types import RawDataDict
from ..mem import overview_daily_mean_memory

router = APIRouter(prefix="/overview")


@router.post("/valid_years")
async def get_valid_years(exp_name: str) -> list[int]:
    data: enilm.yaml.data.RawData = get_data(exp_name).overlapping_data

    # get all years
    ts_index = data["mains"].index
    assert isinstance(ts_index, pd.DatetimeIndex)
    years = ts_index.year.unique().tolist()

    return years


class DailyMeanResponse(BaseModel):
    mains: RawDataDict
    app: RawDataDict


@router.post("/daily_mean")
async def get_daily_mean(exp_name: str) -> DailyMeanResponse:
    @overview_daily_mean_memory.cache
    def _cached(exp_name):
        # get data
        data: enilm.yaml.data.RawData = get_data(exp_name).overlapping_data

        # get exp app
        apps = get_config(exp_name).selected_apps
        if apps is None:
            raise ValueError(f"No selected_apps in config for {exp_name}")
        if len(apps) != 1:
            raise ValueError(f"Only one app is supported, but got {apps}")
        app = apps[0]

        return DailyMeanResponse(
            mains=data["mains"].resample("D").mean().to_dict(),
            app=data[app].resample("D").mean().to_dict(),
        )

    return _cached(exp_name)
