from typing import Optional

import holidays
import pandas as pd
from pydantic import BaseModel
from fastapi import APIRouter

from enilm.dt.workday import get_holidays_calendar_from_ds
from enilm.dt.nilmtktf import get_tzinfo_from_ds
from enilm.dt.sun import get_suntimes_for_day
from enilm.datasets import get_dataset_by_name

from .. import tz
from ..types import PDTimestamp
from ..mem import get_exp_mem
from ..exps import get_exp_by_name

router = APIRouter(prefix="/day_info")


class DayInfoParams(BaseModel):
    ts: PDTimestamp
    exp_name: str


class DayInfoResponse(BaseModel):
    holiday: bool
    holiday_name: Optional[str]
    day_name: str
    weekend: bool
    sunrise: Optional[PDTimestamp]
    sunset: Optional[PDTimestamp]


@router.post("/")
async def get_day_info(params: DayInfoParams) -> DayInfoResponse:
    exp = get_exp_by_name(params.exp_name)
    exp_mem = get_exp_mem(params.exp_name).memory

    # timestamp with tz info from data
    ds = exp.dataset
    enilm_ds = get_dataset_by_name(ds)
    ds_tz = get_tzinfo_from_ds(enilm_ds)
    ts = tz.convert_pdtimestamp(params.ts, ds_tz)

    @exp_mem.cache
    def get_exp_holidays_cal() -> holidays.HolidayBase:
        holiday_cal = get_holidays_calendar_from_ds(ds)
        return holiday_cal

    cal = get_exp_holidays_cal()
    holiday = cal.get(ts.date())
    suntimes = get_suntimes_for_day(ts, enilm_ds)

    return DayInfoResponse(
        holiday=holiday is not None,
        holiday_name=holiday,
        day_name=ts.strftime("%A"),
        weekend=ts.weekday() >= 5,
        sunrise=pd.Timestamp(suntimes.sunrise) if suntimes is not None else None,
        sunset=pd.Timestamp(suntimes.sunset) if suntimes is not None else None,
    )
