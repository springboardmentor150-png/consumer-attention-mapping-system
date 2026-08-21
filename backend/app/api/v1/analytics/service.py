from datetime import datetime, timezone, timedelta
from uuid import UUID
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select
from fastapi import status, HTTPException

from app.models.shopper_session import ShopperSession
from app.models.attention_event import AttentionEvent
from app.schemas.attention import AttentionEventCreate
from app.schemas.analytics import (
    AttentionReportResponse,
    ShelfAttentionSummary,
    ZoneTrafficSummary,
    HourlyTrafficPoint
)
from app.services.analytics.attention_aggregator import AttentionAggregator

class AnalyticsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_dashboard_data(self, store_id: UUID, period: str) -> AttentionReportResponse:
        """Fetch dashboard metrics and reports consolidated by aggregator."""
        agg = AttentionAggregator(self.db)
        data = await agg.get_dashboard_analytics(store_id, period)
        return AttentionReportResponse(
            store_id=store_id,
            generated_at=datetime.now(timezone.utc),
            period=period,
            data=data
        )

    async def get_shelf_rankings(self, store_id: UUID) -> List[ShelfAttentionSummary]:
        """Fetch ranked list of shelf performance today."""
        agg = AttentionAggregator(self.db)
        now = datetime.now(timezone.utc)
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        return await agg.get_shelf_attention_summary(store_id, start_date, end_date)

    async def get_zone_traffic(self, store_id: UUID) -> List[ZoneTrafficSummary]:
        """Fetch visitors and traffic details per zone."""
        agg = AttentionAggregator(self.db)
        return await agg.get_zone_traffic(store_id)

    async def get_hourly_traffic(self, store_id: UUID, target_date: datetime) -> List[HourlyTrafficPoint]:
        """Fetch visitor distribution by hour for a specific target date."""
        agg = AttentionAggregator(self.db)
        return await agg.get_hourly_traffic(store_id, target_date)

    async def record_attention_event(self, event_data: AttentionEventCreate) -> AttentionEvent:
        """Create and save an AttentionEvent record in the database."""
        event = AttentionEvent(
            session_id=str(event_data.session_id),
            camera_id=str(event_data.camera_id),
            shelf_id=str(event_data.shelf_id) if event_data.shelf_id else None,
            zone_id=str(event_data.zone_id) if event_data.zone_id else None,
            event_type=event_data.event_type,
            gaze_x=event_data.gaze_x,
            gaze_y=event_data.gaze_y,
            head_yaw=event_data.head_yaw,
            head_pitch=event_data.head_pitch,
            head_roll=event_data.head_roll,
            attention_duration_seconds=event_data.attention_duration_seconds,
            is_looking_at_shelf=event_data.is_looking_at_shelf,
            confidence_score=event_data.confidence_score,
            timestamp=datetime.now(timezone.utc)
        )
        self.db.add(event)
        await self.db.commit()
        await self.db.refresh(event)
        return event

    async def get_active_shoppers_count(self, store_id: UUID) -> int:
        """Get the count of active shoppers inside a store."""
        stmt = select(func.count(ShopperSession.id)).where(
            ShopperSession.store_id == str(store_id),
            ShopperSession.is_active == True
        )
        res = await self.db.execute(stmt)
        return res.scalar() or 0
