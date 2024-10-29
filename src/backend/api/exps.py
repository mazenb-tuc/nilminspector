from typing import List

from fastapi import APIRouter

from .. import exps
from .. import types
from .. import dates

router = APIRouter(prefix="/exps")


class WithTrainTestDates:
    train_start: types.PDTimestamp
    train_end: types.PDTimestamp
    test_start: types.PDTimestamp
    test_end: types.PDTimestamp


class ParsedExp(exps.Exp):
    type: str = "Exp"


class ParsedModelExp(exps.ModelExp, WithTrainTestDates):
    type: str = "ModelExp"


@router.get("/all")
async def getAllExps() -> List[ParsedExp | ParsedModelExp]:
    all_exps = []
    for exp in exps.all_exps:
        # the order if isinstance checks is important!
        if isinstance(exp, exps.ModelExp):
            exp_dates = dates.get_start_end_dates_for_exp(exp.exp_name)
            parsed_exp = ParsedModelExp(
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
            all_exps.append(parsed_exp)
        elif isinstance(exp, exps.Exp):
            all_exps.append(ParsedExp(**exp.model_dump()))
        else:
            raise ValueError(f"Unknown exp type: {exp}")
    return all_exps
