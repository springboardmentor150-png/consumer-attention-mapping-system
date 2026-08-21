import os

from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter()


@router.get("/store")
def get_store_heatmap():

    image_path = "heatmaps/store_heatmap.png"

    if not os.path.exists(image_path):

        return {
            "message": "Heatmap not generated yet."
        }

    return FileResponse(
        image_path,
        media_type="image/png",
        filename="store_heatmap.png"
    )