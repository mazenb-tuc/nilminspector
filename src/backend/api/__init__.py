from fastapi import APIRouter

from .data import router as data_router
from .predict import router as predict_router
from .err import router as err_router
from .std import router as std_router
from .utils import router as utils_router
from .exps import router as exps_router
from .fm import router as fm_router
from .day_info import router as day_info_router
from .ds_info import router as ds_info_router
from .rnd import router as rnd_router
from .overview import router as overview_router

router = APIRouter(prefix="/api")

# subrouters
router.include_router(data_router)
router.include_router(predict_router)
router.include_router(err_router)
router.include_router(std_router)
router.include_router(utils_router)
router.include_router(exps_router)
router.include_router(fm_router)
router.include_router(day_info_router)
router.include_router(ds_info_router)
router.include_router(rnd_router)
router.include_router(overview_router)
