from pydantic import BaseModel, ConfigDict

import enilm.etypes.ser
import enilm.yaml.config
import enilm.yaml.data
import enilm.yaml.daily
import enilm.yaml.daily.split

from .config import get_config
from .mem import get_exp_mem


class GetDataResult(BaseModel):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    raw_data: enilm.yaml.data.RawData
    resampled_data: enilm.yaml.data.RawData
    overlapping_data: enilm.yaml.data.RawData
    each_day_cleaned: enilm.yaml.daily.DailyData
    each_day_cleaned_traintest: enilm.yaml.daily.split.DailySplit
    xy_cleaned: enilm.yaml.daily.split.XYNP


def get_data(exp_name: str) -> GetDataResult:
    config = get_config(exp_name)
    exp_mem = get_exp_mem(exp_name).memory

    @exp_mem.cache()
    def inner_get_data(config: enilm.yaml.config.Config) -> GetDataResult:
        raw_data: enilm.yaml.data.RawData = enilm.yaml.data.raw(config)
        resampled_data = enilm.yaml.data.resample(config)
        overlapping_data = enilm.yaml.data.overlapping(config)
        each_day_cleaned = enilm.yaml.daily.clean(config)
        each_day_cleaned_traintest = enilm.yaml.daily.split.train_test(
            each_day_cleaned, config
        )
        xy_cleaned = enilm.yaml.daily.split.traintest_xy(each_day_cleaned_traintest)

        return GetDataResult(
            raw_data=raw_data,
            resampled_data=resampled_data,
            overlapping_data=overlapping_data,
            each_day_cleaned=each_day_cleaned,
            each_day_cleaned_traintest=each_day_cleaned_traintest,
            xy_cleaned=xy_cleaned,
        )

    return inner_get_data(config)
