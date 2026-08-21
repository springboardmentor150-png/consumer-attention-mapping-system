from uuid import UUID
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies.permissions import require_role
from app.api.v1.behavior.service import BehaviorService
from app.schemas.behavior import (
    BehaviorSegmentResponse,
    StoreSegmentSummary,
    SegmentDistribution
)

router = APIRouter()

@router.post("/classify/{store_id}", response_model=Dict[str, Any])
async def classify_store_sessions(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: Any = Depends(require_role(["super_admin", "store_manager"]))
):
    service = BehaviorService(db)
    return await service.classify_store_sessions(store_id)

@router.get("/segments/{store_id}", response_model=StoreSegmentSummary)
async def get_segment_summary(
    store_id: UUID,
    period: str = Query("week"),
    db: AsyncSession = Depends(get_db),
):
    service = BehaviorService(db)
    return await service.get_segment_summary(store_id, period)

@router.get("/segments/{store_id}/distribution", response_model=List[SegmentDistribution])
async def get_segment_distribution(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = BehaviorService(db)
    summary = await service.get_segment_summary(store_id)
    return summary.segments

@router.get("/sessions/{session_id}", response_model=BehaviorSegmentResponse)
async def get_session_segment(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = BehaviorService(db)
    return await service.get_session_segment(session_id)

@router.get("/journey/{session_id}", response_model=Dict[str, Any])
async def get_journey_analysis(
    session_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    service = BehaviorService(db)
    return await service.get_journey_analysis(session_id)
