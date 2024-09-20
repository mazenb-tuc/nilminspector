from fastapi import APIRouter

from ..model import PredictParams, PredictResponse, pred


router = APIRouter(prefix="/predict")


@router.post("/")
async def root(predict_params: PredictParams) -> PredictResponse:
    return pred(predict_params)
