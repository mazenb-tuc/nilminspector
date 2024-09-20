from pydantic import BaseModel
from fastapi import APIRouter

import enilm.datasets


router = APIRouter(prefix="/ds_info")


class GetDsMetadataParams(BaseModel):
    ds: str


@router.post("/metadata")
async def get_ds_metadata(params: GetDsMetadataParams) -> dict:
    ds = enilm.datasets.get_dataset_by_name(params.ds)
    nilmtk_ds = enilm.datasets.get_nilmtk_dataset(ds)
    if nilmtk_ds.metadata is not None and isinstance(nilmtk_ds.metadata, dict):
        return nilmtk_ds.metadata
    return {}
