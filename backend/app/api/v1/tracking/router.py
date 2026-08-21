from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies.permissions import require_store_manager
from app.api.dependencies.auth import get_current_active_user
from app.schemas.tracking import (
    TrackingSessionCreate,
    TrackingSessionResponse,
    ActiveShopperInfo
)
from app.api.v1.tracking.service import TrackingService

router = APIRouter()

@router.post("/start", response_model=TrackingSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_session(
    schema: TrackingSessionCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_store_manager)
):
    """Start tracking a new video processing session."""
    service = TrackingService(db)
    return await service.create_tracking_session(schema)

@router.post("/stop/{session_id}", response_model=TrackingSessionResponse)
async def stop_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(require_store_manager)
):
    """Stop an active video tracking session."""
    service = TrackingService(db)
    return await service.stop_tracking_session(session_id)

@router.get("/sessions", response_model=List[TrackingSessionResponse])
async def list_sessions(
    store_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """List tracking sessions."""
    service = TrackingService(db)
    return await service.list_tracking_sessions(store_id, status, skip, limit)

@router.get("/sessions/{session_id}", response_model=TrackingSessionResponse)
async def get_session(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Get details of a single tracking session."""
    service = TrackingService(db)
    return await service.get_tracking_session(session_id)

@router.get("/active/{store_id}", response_model=List[ActiveShopperInfo])
async def get_active_shoppers(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Get active shoppers and their accumulated dwell times for a store."""
    service = TrackingService(db)
    return await service.get_active_shopper_sessions(store_id)
