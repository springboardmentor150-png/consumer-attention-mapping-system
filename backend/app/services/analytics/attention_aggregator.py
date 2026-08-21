from datetime import datetime, timezone, timedelta
from uuid import UUID
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.models.shopper_session import ShopperSession
from app.models.attention_event import AttentionEvent
from app.models.shelf import Shelf
from app.models.zone import StoreZone
from app.schemas.analytics import (
    ShelfAttentionSummary,
    ZoneTrafficSummary,
    HourlyTrafficPoint,
    DashboardAnalytics
)

class AttentionAggregator:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_shelf_attention_summary(
        self, store_id: UUID, start_date: datetime, end_date: datetime
    ) -> List[ShelfAttentionSummary]:
        """Aggregate attention events per shelf in the given period."""
        # Query events joined with shelves
        stmt = (
            select(AttentionEvent, Shelf)
            .join(Shelf, AttentionEvent.shelf_id == Shelf.id)
            .where(
                Shelf.store_id == str(store_id),
                AttentionEvent.timestamp >= start_date,
                AttentionEvent.timestamp <= end_date
            )
        )
        result = await self.db.execute(stmt)
        rows = result.all()

        # Group in python for dialect safety
        shelf_groups: Dict[str, Dict[str, Any]] = {}
        for event, shelf in rows:
            sid = shelf.id
            if sid not in shelf_groups:
                shelf_groups[sid] = {
                    "shelf_id": UUID(sid),
                    "shelf_name": shelf.name,
                    "total_attention_seconds": 0.0,
                    "viewers": set(),
                }
            shelf_groups[sid]["total_attention_seconds"] += event.attention_duration_seconds
            shelf_groups[sid]["viewers"].add(event.session_id)

        summaries = []
        for sid, group in shelf_groups.items():
            total_sec = round(group["total_attention_seconds"], 2)
            unique_v = len(group["viewers"])
            avg_sec = round(total_sec / unique_v if unique_v > 0 else 0.0, 2)
            
            summaries.append(
                ShelfAttentionSummary(
                    shelf_id=group["shelf_id"],
                    shelf_name=group["shelf_name"],
                    total_attention_seconds=total_sec,
                    unique_viewers=unique_v,
                    avg_dwell_seconds=avg_sec
                )
            )

        # Sort by total attention descending and assign rank
        summaries.sort(key=lambda x: x.total_attention_seconds, reverse=True)
        for i, s in enumerate(summaries):
            s.engagement_rank = i + 1

        return summaries

    async def get_zone_traffic(self, store_id: UUID) -> List[ZoneTrafficSummary]:
        """Aggregate visitor traffic and dwell times per zone."""
        # Load all zones for mapping ID to name
        zone_stmt = select(StoreZone).where(StoreZone.store_id == str(store_id))
        zone_res = await self.db.execute(zone_stmt)
        zones = {z.id: z.name for z in zone_res.scalars().all()}

        # Load sessions
        session_stmt = select(ShopperSession).where(ShopperSession.store_id == str(store_id))
        session_res = await self.db.execute(session_stmt)
        sessions = session_res.scalars().all()

        zone_stats: Dict[str, Dict[str, Any]] = {
            zid: {"visitors": 0, "dwells": []} for zid in zones
        }

        for sess in sessions:
            # check visited zones
            visited = sess.zones_visited or []
            # handle case where zones_visited might be a string (JSON list)
            if isinstance(visited, str):
                import json
                try:
                    visited = json.loads(visited)
                except Exception:
                    visited = []
                    
            for zid in visited:
                if zid in zone_stats:
                    zone_stats[zid]["visitors"] += 1
                    zone_stats[zid]["dwells"].append(sess.total_dwell_time_seconds)

        summaries = []
        for zid, stats in zone_stats.items():
            visitors = stats["visitors"]
            dwells = stats["dwells"]
            avg_time = round(sum(dwells) / len(dwells) if len(dwells) > 0 else 0.0, 2)
            
            summaries.append(
                ZoneTrafficSummary(
                    zone_id=UUID(zid),
                    zone_name=zones[zid],
                    total_visitors=visitors,
                    avg_time_seconds=avg_time
                )
            )
        return summaries

    async def get_hourly_traffic(self, store_id: UUID, target_date: datetime) -> List[HourlyTrafficPoint]:
        """Get traffic points grouped by hour of the day."""
        start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)

        stmt = select(ShopperSession).where(
            ShopperSession.store_id == str(store_id),
            ShopperSession.entry_time >= start_of_day,
            ShopperSession.entry_time < end_of_day
        )
        res = await self.db.execute(stmt)
        sessions = res.scalars().all()

        hour_buckets: Dict[int, List[float]] = {h: [] for h in range(24)}
        for sess in sessions:
            h = sess.entry_time.astimezone().hour  # use local or utc hour
            hour_buckets[h].append(sess.total_dwell_time_seconds)

        points = []
        for h in range(24):
            dwells = hour_buckets[h]
            points.append(
                HourlyTrafficPoint(
                    hour=h,
                    visitor_count=len(dwells),
                    avg_dwell_seconds=round(sum(dwells) / len(dwells) if len(dwells) > 0 else 0.0, 2)
                )
            )
        return points

    async def get_dashboard_analytics(self, store_id: UUID, period: str = "today") -> DashboardAnalytics:
        """Fetch consolidated dashboard analytics."""
        now = datetime.now(timezone.utc)
        
        # Calculate time period bounds
        if period == "today":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
        elif period == "7d":
            start_date = now - timedelta(days=7)
            end_date = now
        elif period == "30d":
            start_date = now - timedelta(days=30)
            end_date = now
        else:
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)

        # Get top shelves
        top_shelves = await self.get_shelf_attention_summary(store_id, start_date, end_date)
        
        # Get zone traffic
        zone_traffic = await self.get_zone_traffic(store_id)
        
        # Get hourly traffic
        hourly_traffic = await self.get_hourly_traffic(store_id, now)

        # Get total visitors in period
        visitor_stmt = select(func.count(ShopperSession.id)).where(
            ShopperSession.store_id == str(store_id),
            ShopperSession.entry_time >= start_date,
            ShopperSession.entry_time <= end_date
        )
        visitor_res = await self.db.execute(visitor_stmt)
        total_visitors = visitor_res.scalar() or 0

        # Get average dwell time
        dwell_stmt = select(func.avg(ShopperSession.total_dwell_time_seconds)).where(
            ShopperSession.store_id == str(store_id),
            ShopperSession.entry_time >= start_date,
            ShopperSession.entry_time <= end_date
        )
        dwell_res = await self.db.execute(dwell_stmt)
        avg_dwell = round(float(dwell_res.scalar() or 0.0), 2)

        # Get active shoppers now
        active_stmt = select(func.count(ShopperSession.id)).where(
            ShopperSession.store_id == str(store_id),
            ShopperSession.is_active == True
        )
        active_res = await self.db.execute(active_stmt)
        active_now = active_res.scalar() or 0

        return DashboardAnalytics(
            store_id=store_id,
            period=period,
            total_visitors=total_visitors,
            avg_dwell_time_seconds=avg_dwell,
            top_attention_shelves=top_shelves,
            zone_traffic=zone_traffic,
            hourly_traffic=hourly_traffic,
            active_shoppers_now=active_now
        )
