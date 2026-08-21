import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.postgres import get_db
from app.schemas.camera import CameraCreate, CameraUpdate, CameraResponse, CameraStatusUpdate
from app.api.dependencies.auth import get_current_active_user
from app.api.dependencies.permissions import require_store_manager, require_super_admin
from app.api.v1.cameras.service import CameraService
from app.models.camera import Camera

router = APIRouter(tags=["Cameras"])

@router.post("", response_model=CameraResponse, status_code=status.HTTP_201_CREATED)
async def create_camera(
    camera_in: CameraCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_store_manager)
) -> CameraResponse:
    """Register a new camera (Store Manager+)."""
    return await CameraService.create_camera(db, camera_in)

@router.get("", response_model=List[CameraResponse])
async def get_cameras(
    store_id: Optional[uuid.UUID] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> List[CameraResponse]:
    """Retrieve cameras, optionally filtered by store (Authenticated)."""
    if store_id:
        return await CameraService.get_cameras_by_store(db, store_id)
    
    from sqlalchemy.future import select
    result = await db.execute(select(Camera))
    return list(result.scalars().all())

@router.get("/{camera_id}", response_model=CameraResponse)
async def get_camera(
    camera_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> CameraResponse:
    """Retrieve details of a specific camera (Authenticated)."""
    camera = await CameraService.get_camera_by_id(db, camera_id)
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found."
        )
    return camera

@router.put("/{camera_id}", response_model=CameraResponse)
async def update_camera(
    camera_id: uuid.UUID,
    camera_in: CameraUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_store_manager)
) -> CameraResponse:
    """Update camera details (Store Manager+)."""
    camera = await CameraService.update_camera(db, camera_id, camera_in)
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found."
        )
    return camera

@router.delete("/{camera_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera(
    camera_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_super_admin)
) -> None:
    """Delete a camera registration (Super Admin only)."""
    success = await CameraService.delete_camera(db, camera_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found."
        )
    return

@router.patch("/{camera_id}/status", response_model=CameraResponse)
async def update_camera_status(
    camera_id: uuid.UUID,
    status_update: CameraStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_store_manager)
) -> CameraResponse:
    """Update camera operational status (Store Manager+)."""
    camera = await CameraService.update_status(db, camera_id, status_update.status)
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found."
        )
    return camera

@router.post("/{camera_id}/heartbeat", response_model=CameraResponse)
async def update_camera_heartbeat(
    camera_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
) -> CameraResponse:
    """Report online heartbeat status from a camera (Public/Camera-facing endpoint)."""
    camera = await CameraService.update_heartbeat(db, camera_id)
    if not camera:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found."
        )
    return camera

@router.get("/{camera_id}/health")
async def get_camera_health(
    camera_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_active_user)
) -> dict:
    """Query real-time connection status of a camera (Authenticated)."""
    health = await CameraService.get_camera_health(db, camera_id)
    if not health:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Camera not found."
        )
    return health
