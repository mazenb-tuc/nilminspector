# see nbs/other/30-blond-rnd-valid-day-date/30.ipynb

from pydantic import BaseModel
from fastapi import APIRouter
import pandas as pd
import numpy as np

import enilm.etypes
import enilm.etypes.ser

from .. import data
from .. import exps
from .. import types
from .. import apps

router = APIRouter(prefix="/rnd")


class GetRandomValidDayDateParams(BaseModel):
    exp_name: str
    app_name: enilm.etypes.AppName
    only_active: bool = False


class GetRandomValidDayDateResponse(BaseModel):
    timestamp: types.PDTimestamp | None = None
    err: bool = False
    msg: str = ""


@router.post("/valid_day_date")
async def getRandomValidDayDate(
    params: GetRandomValidDayDateParams,
) -> GetRandomValidDayDateResponse:
    """
    Get random valid day date for the given experiment and app.
    """
    exp_data = data.get_data(params.exp_name).overlapping_data
    matched_app_name = apps.find_matching_app_name_in_data_keys(
        params.exp_name,
        params.app_name,
        exp_data.keys(),
    )
    exp_app_data = exp_data[matched_app_name]

    # select random slice of data of the length of one day
    exp = exps.get_exp_by_name(params.exp_name)
    n_samples_in_day = exp.resample_params.n_samples_per_day()

    # random start
    # start_idx = np.random.randint(0, len(data) - n_samples_in_day)
    # data_slice: enilm.etypes.ser.PDTimeSeries = data.iloc[
    #     start_idx : start_idx + n_samples_in_day
    # ]

    # random start but at the beginning of a day i.e. at 00:00
    # 1. create a mask for start of the day
    # 2. normalize the datetime index to remove the time part and check where the time is midnight.
    # 3. if exact midnight times might not be available, we check for the minimum time of each day.
    # 4. if only_active, ensure that the app avg activity is above a threshold, else repeat step 2.
    assert isinstance(exp_app_data.index, pd.DatetimeIndex)

    # datetimeindex normalize: https://pandas.pydata.org/docs/reference/api/pandas.DatetimeIndex.normalize.html
    # The time component of the date-time is converted to midnight i.e. 00:00:00.
    # This is useful in cases, when the time does not matter. Length is unaltered. The timezones are unaffected.
    start_of_day_mask = exp_app_data.index.normalize() == exp_app_data.index

    # filter the series to get only the start of the day entries
    start_of_day_series = exp_app_data[start_of_day_mask]

    # if the above results in no entries because of no exact midnights, we need to approximate to the closest available:
    if start_of_day_series.empty:
        # Group by the date and take the first entry of each day
        start_of_day_series = exp_app_data.groupby(exp_app_data.index.date).first()

    rnd_start_idx = np.random.choice(start_of_day_series.index)
    data_slice: enilm.etypes.ser.PDTimeSeries = exp_app_data.loc[
        rnd_start_idx : rnd_start_idx + pd.Timedelta("1 day")
    ].iloc[:-1]  # to remove the last entry which is the start of the next day

    found_active = False
    if params.only_active:
        avg_activity = data_slice.mean()
        if avg_activity > exp.on_power_threshold:
            found_active = True

    # search for a maximum of 100 times to find a valid day
    max_n_attempts = 100
    curr_attempt = 0
    while len(data_slice) != n_samples_in_day or (
        params.only_active and not found_active
    ):
        curr_attempt += 1
        if curr_attempt > max_n_attempts:
            return GetRandomValidDayDateResponse(
                err=True, msg="Could not find a valid day."
            )

        rnd_start_idx = np.random.choice(start_of_day_series.index)
        data_slice: enilm.etypes.ser.PDTimeSeries = exp_app_data.loc[
            rnd_start_idx : rnd_start_idx + pd.Timedelta("1 day")
        ].iloc[:-1]  # to remove the last entry which is the start of the next day

        if params.only_active:
            avg_activity = data_slice.mean()
            if avg_activity > exp.on_power_threshold:
                found_active = True

    return GetRandomValidDayDateResponse(timestamp=rnd_start_idx)
