from dataclasses import dataclass

from enilm.yaml.config import DayDate

from .mem import exp_start_end_dates_memory
from .data import get_data


@dataclass
class ExpStartEndDates:
    train_start: DayDate
    train_end: DayDate
    test_start: DayDate
    test_end: DayDate


@exp_start_end_dates_memory.cache
def get_start_end_dates_for_exp(exp_name: str) -> ExpStartEndDates:
    # get start/end dates for each experiment
    each_day_data = get_data(exp_name).each_day_cleaned_traintest
    train_days = list(each_day_data.train["mains"].keys())
    test_days = list(each_day_data.test["mains"].keys())
    
    # TODO: assert pd.Timestamp(x) for all dates

    return ExpStartEndDates(
        train_start=train_days[0],
        train_end=train_days[-1],
        test_start=test_days[0],
        test_end=test_days[-1],
    )
