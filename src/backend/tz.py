# timezone conversion functions

import datetime

from enilm.datasets import get_dataset_by_name
from enilm.dt.nilmtktf import get_tzinfo_from_ds

from .exps import get_exp_by_name
from .types import PDTimestamp


def convert_pdtimestamp(
    timestamp: PDTimestamp,
    target_tz: datetime.tzinfo,
) -> PDTimestamp:
    if timestamp.tzinfo is None:
        # if timestamp is tz-naive, convert it to tz-aware
        return timestamp.tz_localize(target_tz)
    # else convert it to the dataset's timezone assuming it is timezone-aware
    return timestamp.tz_convert(target_tz)


def convert_pdtimestamp_for_exp_data(
    timestamp: PDTimestamp, exp_name: str
) -> PDTimestamp:
    exp = get_exp_by_name(exp_name)
    ds = exp.dataset
    enilm_ds = get_dataset_by_name(ds)
    ds_tz = get_tzinfo_from_ds(enilm_ds)
    return convert_pdtimestamp(timestamp, ds_tz)
