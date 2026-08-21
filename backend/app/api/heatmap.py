from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

router = APIRouter(prefix="/heatmaps", tags=["Heatmaps"])


@router.get("/store")
def get_store_heatmap():

    path = "heatmaps/store_heatmap.png"

    if not os.path.exists(path):
        return {"message": "Heatmap not generated yet."}

    return FileResponse(path)
