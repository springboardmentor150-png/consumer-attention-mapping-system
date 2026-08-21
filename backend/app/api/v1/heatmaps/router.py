from uuid import UUID
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies.permissions import require_role
from app.api.v1.heatmaps.service import HeatmapService
from app.schemas.heatmap import (
    HeatmapGenerateRequest,
    HeatmapResponse,
    HeatmapListResponse
)

router = APIRouter()

@router.post("/generate", response_model=HeatmapResponse)
async def generate_heatmap(
    request: HeatmapGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(require_role(["super_admin", "store_manager"]))
):
    service = HeatmapService(db)
    return await service.generate_heatmap(request)

@router.get("/store/{store_id}", response_model=HeatmapListResponse)
async def get_store_heatmaps(
    store_id: UUID,
    heatmap_type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    service = HeatmapService(db)
    return await service.get_store_heatmaps(store_id, heatmap_type)

@router.get("/{heatmap_id}", response_model=HeatmapResponse)
async def get_heatmap(
    heatmap_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = HeatmapService(db)
    return await service.get_heatmap(heatmap_id)

@router.get("/{heatmap_id}/image")
async def get_heatmap_image(
    heatmap_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = HeatmapService(db)
    path = await service.get_image_path(heatmap_id)
    return FileResponse(path, media_type="image/png")

@router.delete("/{heatmap_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_heatmap(
    heatmap_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: str = Depends(require_role(["super_admin", "store_manager"]))
):
    service = HeatmapService(db)
    await service.delete_heatmap(heatmap_id)
