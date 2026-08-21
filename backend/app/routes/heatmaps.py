from fastapi import APIRouter
from fastapi.responses import FileResponse
import os

from app.ai.heatmap import generate_heatmap

router = APIRouter(
    prefix="/api/heatmaps",
    tags=["Heatmaps"]
)


@router.get("/store")
def get_store_heatmap():
    path = generate_heatmap()

    if not os.path.exists(path):
        return {"message": "Heatmap not found"}

    return FileResponse(path, media_type="image/jpeg")
