import pandas as pd
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter(prefix="/utils")


class ResampleRuleToSecondsParams(BaseModel):
    rule: str


@router.post("/resample_rule_to_seconds")
async def resample_rule_to_seconds(params: ResampleRuleToSecondsParams) -> int:
    return pd.Timedelta(params.rule).seconds
