from typing import List

from fastapi import APIRouter

from .. import exps
from .. import types
from .. import dates

router = APIRouter(prefix="/exps")


class ParsedExp(exps.Exp):
    train_start: types.PDTimestamp
    train_end: types.PDTimestamp
    test_start: types.PDTimestamp
    test_end: types.PDTimestamp


@router.get("/all")
async def getAllExps() -> List[ParsedExp]:
    all_exps = []
    for exp in exps.all_exps:
        exp_dates = dates.get_start_end_dates_for_exp(exp.exp_name)
        all_exps.append(
            ParsedExp(
                **{
                    **exp.model_dump(),
                    **{
                        "train_start": exp_dates.train_start,
                        "train_end": exp_dates.train_end,
                        "test_start": exp_dates.test_start,
                        "test_end": exp_dates.test_end,
                    },
                }
            )
        )
    return all_exps
