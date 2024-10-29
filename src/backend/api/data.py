from pydantic import BaseModel, field_validator
from fastapi import APIRouter
import pandas as pd
import nilmtk

import enilm.etypes.ser
import enilm.yaml.config
import enilm.yaml.data
import enilm.yaml.daily
import enilm.yaml.daily.split
import enilm.etypes
import enilm.datasets.loaders
import enilm.appliances

from .. import tz
from ..data import get_data
from ..types import RawDataDict, PDTimestamp
from ..mem import ds_house_dt_range_memory
from ..apps import find_matching_app_name_in_data_keys

router = APIRouter(prefix="/data")


class DatetimeRangeParams(BaseModel):
    dataset: enilm.etypes.DatasetID
    house: enilm.etypes.HouseNr
    app: enilm.etypes.AppName


class DatetimeRange(BaseModel):
    start: PDTimestamp
    end: PDTimestamp


@router.post("/datetime_range")
async def getDatetimeRange(params: DatetimeRangeParams) -> DatetimeRange:
    @ds_house_dt_range_memory.cache
    def get_datetime_range(params: DatetimeRangeParams) -> DatetimeRange:
        load_res = enilm.datasets.loaders.load(
            dataset=params.dataset,
            building_nr=params.house,
        )
        house_elec: nilmtk.MeterGroup = load_res.elec
        app: nilmtk.Appliance = (
            enilm.appliances.get_appliance_by_label_name_from_nilmtk_metergroup(
                params.app, house_elec
            )
        )
        app_elec: nilmtk.MeterGroup | nilmtk.ElecMeter = enilm.appliances.get_elec(
            app, house_elec
        )
        tframe: nilmtk.TimeFrame = app_elec.get_timeframe()  # type: ignore
        if not isinstance(tframe, nilmtk.TimeFrame):
            raise ValueError(
                f"Timeframe for {params.app} in house {params.house} in dataset {params.dataset} is not a TimeFrame"
            )
        assert isinstance(tframe.start, pd.Timestamp)
        assert isinstance(tframe.end, pd.Timestamp)

        # TODO: I am not sure how accurate the tframe compared to actual available app data
        # consider instead loading the actual data and checking the time range
        # this could be costly, but it is more accurate
        # see nbs/other/21-tframe-from-ds-app-house

        return DatetimeRange(
            start=tframe.start,
            end=tframe.end,
        )

    return get_datetime_range(params)


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
    matched_app_name = find_matching_app_name_in_data_keys(
        params.data_exp_name,
        params.app_name,
        data.keys(),
    )

    # change timezone of start time from UTC to the timezone of the data without changing the time
    start_time_with_tz: pd.Timestamp = tz.convert_pdtimestamp_for_exp_data(
        params.start,
        params.data_exp_name,
    )

    start = data[matched_app_name].index[0]
    assert isinstance(start, pd.Timestamp)
    assert start_time_with_tz >= start

    end = data[matched_app_name].index[-1]
    assert isinstance(end, pd.Timestamp)
    assert start_time_with_tz <= end

    # slice data
    overlapping_data_slice: enilm.etypes.ser.PDTimeSeries = data[matched_app_name][
        start_time_with_tz : start_time_with_tz + pd.Timedelta(params.duration)
    ]

    overlapping_data_dict: RawDataDict = overlapping_data_slice.to_dict()
    return overlapping_data_dict


class DataStartEndParams(BaseModel):
    exp_name: str
    app_name: enilm.etypes.AppName
    start: PDTimestamp
    end: PDTimestamp


@router.post("/start_end")
async def getDataStartEnd(params: DataStartEndParams) -> RawDataDict:
    assert isinstance(params.start, pd.Timestamp)
    assert isinstance(params.end, pd.Timestamp)
    assert isinstance(params.app_name, str)

    # get all data
    data = get_data(params.exp_name).overlapping_data
    
    # get correct app name
    matched_app_name = find_matching_app_name_in_data_keys(
        params.exp_name,
        params.app_name,
        data.keys(),
    )
    params.app_name = matched_app_name

    # change timezone from UTC to the timezone of the data without changing the time
    start_time_with_tz: pd.Timestamp = tz.convert_pdtimestamp_for_exp_data(
        params.start,
        params.exp_name,
    )
    end_time_with_tz: pd.Timestamp = tz.convert_pdtimestamp_for_exp_data(
        params.end,
        params.exp_name,
    )

    start = data[params.app_name].index[0]
    assert isinstance(start, pd.Timestamp)
    assert start_time_with_tz >= start

    end = data[params.app_name].index[-1]
    assert isinstance(end, pd.Timestamp)
    assert start_time_with_tz <= end

    # slice data
    overlapping_data_slice: enilm.etypes.ser.PDTimeSeries = data[params.app_name][
        start_time_with_tz:end_time_with_tz
    ]

    overlapping_data_dict: RawDataDict = overlapping_data_slice.to_dict()
    return overlapping_data_dict


@router.get("/datasets")
async def get_all_datasets() -> list[enilm.etypes.DatasetID]:
    # AMP has a bug and cannot be loaded with nilmtk!
    return list([ds.name for ds in enilm.etypes.Datasets if ds.name != "AMP"])


@router.get("/houses")
async def get_all_houses(dataset: str) -> list[enilm.etypes.HouseNr]:
    return list(enilm.datasets.get_buildings(dataset).keys())


@router.get("/apps")
async def get_all_apps(dataset: str, house: int) -> list[enilm.etypes.AppName]:
    house_elec = enilm.datasets.loaders.load(
        dataset=enilm.etypes.Datasets[dataset],
        building_nr=house,
    ).elec
    return [app.label(True) for app in house_elec.appliances]
