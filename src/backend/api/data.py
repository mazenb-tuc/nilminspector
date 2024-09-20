from pydantic import BaseModel, field_validator
from fastapi import APIRouter
import pandas as pd

import enilm.etypes.ser
import enilm.yaml.config
import enilm.yaml.data
import enilm.yaml.daily
import enilm.yaml.daily.split
import enilm.etypes
import enilm.datasets.loaders

from .. import tz
from ..data import get_data
from ..types import RawDataDict, PDTimestamp

router = APIRouter(prefix="/data")


class DatetimeRangeParams(BaseModel):
    exp_name: str


class DatetimeRange(BaseModel):
    start: PDTimestamp
    end: PDTimestamp


@router.post("/datetime_range")
async def getDatetimeRange(params: DatetimeRangeParams) -> DatetimeRange:
    data = get_data(params.exp_name).overlapping_data
    start_ts = data["mains"].index[0]
    assert isinstance(start_ts, pd.Timestamp)

    end_ts = data["mains"].index[-1]
    assert isinstance(end_ts, pd.Timestamp)

    # ensure all apps has the same start and end time
    for app in data.keys():
        if app != "mains":
            assert data[app].index[0] == start_ts
            assert data[app].index[-1] == end_ts

    return DatetimeRange(
        start=start_ts,
        end=end_ts,
    )


class DataStartDurationParams(BaseModel):
    data_exp_name: str
    app_name: enilm.etypes.AppName
    start: PDTimestamp
    duration: str

    @field_validator("duration")
    @classmethod
    def check_duration(cls, v):
        try:
            td = pd.Timedelta(v)
        except ValueError:
            raise ValueError("Invalid duration")
        if td == pd.NaT:
            raise ValueError("Invalid duration (NaT)")
        return v


@router.post("/start_duration")
async def getDataStartDuration(params: DataStartDurationParams) -> RawDataDict:
    assert isinstance(params.start, pd.Timestamp)
    assert isinstance(params.duration, str)
    assert isinstance(params.app_name, str)

    # get all data
    data = get_data(params.data_exp_name).overlapping_data

    # change timezone of start time from UTC to the timezone of the data without changing the time
    start_time_with_tz: pd.Timestamp = tz.convert_pdtimestamp_for_exp_data(
        params.start,
        params.data_exp_name,
    )

    start = data[params.app_name].index[0]
    assert isinstance(start, pd.Timestamp)
    assert start_time_with_tz >= start

    end = data[params.app_name].index[-1]
    assert isinstance(end, pd.Timestamp)
    assert start_time_with_tz <= end

    # slice data
    overlapping_data_slice: enilm.etypes.ser.PDTimeSeries = data[params.app_name][
        start_time_with_tz : start_time_with_tz + pd.Timedelta(params.duration)
    ]

    overlapping_data_dict: RawDataDict = overlapping_data_slice.to_dict()
    return overlapping_data_dict
