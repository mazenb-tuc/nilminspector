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
    err: bool = False
    holiday: Optional[bool] = None
    holiday_name: Optional[str] = None
    day_name: Optional[str] = None
    weekend: Optional[bool] = None
    sunrise: Optional[PDTimestamp] = None
    sunset: Optional[PDTimestamp] = None
    err_msg: Optional[str] = None


@router.post("/")
async def get_day_info(params: DayInfoParams) -> DayInfoResponse:
    exp = get_exp_by_name(params.exp_name)
    exp_mem = get_exp_mem(params.exp_name).memory

    # timestamp with tz info from data
    ds = exp.dataset
    try:
        enilm_ds = get_dataset_by_name(ds)
        ds_tz = get_tzinfo_from_ds(enilm_ds)
        ts = tz.convert_pdtimestamp(params.ts, ds_tz)
    except Exception as e:
        return DayInfoResponse(err=True, err_msg=str(e))

    @exp_mem.cache
    def get_exp_holidays_cal(ds) -> holidays.HolidayBase:
        holiday_cal = get_holidays_calendar_from_ds(ds)
        return holiday_cal

    cal = get_exp_holidays_cal(ds)
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
