from fastapi import APIRouter, Depends, Query, status
from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_db
from app.api.dependencies.auth import get_current_active_user
from app.schemas.attention import AttentionEventCreate, AttentionEventResponse
from app.schemas.analytics import (
    AttentionReportResponse,
    ShelfAttentionSummary,
    ZoneTrafficSummary,
    HourlyTrafficPoint
)
from app.api.v1.analytics.service import AnalyticsService
from app.services.analytics.attention_aggregator import AttentionAggregator

router = APIRouter()

@router.get("/dashboard/{store_id}", response_model=AttentionReportResponse)
async def get_dashboard_data(
    store_id: UUID,
    period: str = Query("today"),
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Get consolidated dashboard analytics report for a store."""
    service = AnalyticsService(db)
    return await service.get_dashboard_data(store_id, period)

@router.get("/shelves/{store_id}", response_model=List[ShelfAttentionSummary])
async def get_shelf_rankings(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Get daily shelf attention ranking summaries."""
    service = AnalyticsService(db)
    return await service.get_shelf_rankings(store_id)

@router.get("/zones/{store_id}", response_model=List[ZoneTrafficSummary])
async def get_zone_traffic(
    store_id: UUID,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Get zone visitor stats and traffic summaries."""
    service = AnalyticsService(db)
    return await service.get_zone_traffic(store_id)

@router.get("/hourly/{store_id}", response_model=List[HourlyTrafficPoint])
async def get_hourly_traffic(
    store_id: UUID,
    date: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Get hourly traffic distribution points for a store."""
    service = AnalyticsService(db)
    target_date = datetime.now(timezone.utc)
    if date:
        try:
            target_date = datetime.fromisoformat(date)
        except ValueError:
            pass
    return await service.get_hourly_traffic(store_id, target_date)

@router.post("/events", response_model=AttentionEventResponse, status_code=status.HTTP_201_CREATED)
async def record_event(
    schema: AttentionEventCreate,
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Record an attention event (used by vision pipelines or endpoints)."""
    service = AnalyticsService(db)
    return await service.record_attention_event(schema)

@router.get("/attention", response_model=AttentionReportResponse)
async def get_attention_report(
    store_id: UUID,
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    _ = Depends(get_current_active_user)
):
    """Retrieve full attention report query for a store and date range."""
    service = AnalyticsService(db)
    period = "custom"
    # Fallback default values
    if not start_date:
        start_date = datetime.now(timezone.utc) - timedelta(days=1)
    if not end_date:
        end_date = datetime.now(timezone.utc)
        
    agg = AttentionAggregator(db)
    data = await agg.get_dashboard_analytics(store_id, period)
    # Inject custom dates in top_attention_shelves filters
    data.top_attention_shelves = await agg.get_shelf_attention_summary(store_id, start_date, end_date)
    
    return AttentionReportResponse(
        store_id=store_id,
        generated_at=datetime.now(timezone.utc),
        period=period,
        data=data
    )
