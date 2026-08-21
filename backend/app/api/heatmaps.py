from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
import os

from app.core.dependencies import ALL_ROLES, require_roles


router = APIRouter(
    prefix="/heatmaps",
    tags=["Heatmaps"],
    # Read-only heatmap imagery: visible to every signed-in role.
    dependencies=[Depends(require_roles(*ALL_ROLES))],
)


@router.get("/store")
def get_store_heatmap():

    heatmap_path = os.path.join(
        "app",
        "static",
        "heatmaps",
        "store_heatmap.jpg"
    )

    if not os.path.exists(heatmap_path):
        return {
            "message": "Heatmap has not been generated yet."
        }

    return FileResponse(
        heatmap_path,
        media_type="image/jpeg"
    )