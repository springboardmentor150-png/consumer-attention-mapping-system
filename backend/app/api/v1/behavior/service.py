from uuid import UUID
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from fastapi import HTTPException, status

from app.models.shopper_session import ShopperSession
from app.models.attention_event import AttentionEvent
from app.models.behavior_segment import BehaviorSegment
from app.services.behavior.segmenter import ShopperSegmenter
from app.services.behavior.journey_analyzer import JourneyAnalyzer
from app.schemas.behavior import (
    BehaviorSegmentResponse,
    StoreSegmentSummary,
    SegmentDistribution
)

class BehaviorService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def classify_store_sessions(self, store_id: UUID) -> Dict[str, Any]:
        segmenter = ShopperSegmenter()

        # Fetch sessions for store without BehaviorSegment
        subq = select(BehaviorSegment.session_id)
        stmt = (
            select(ShopperSession)
            .where(
                ShopperSession.store_id == str(store_id),
                ShopperSession.id.not_in(subq)
            )
        )
        res = await self.db.execute(stmt)
        sessions = res.scalars().all()

        if not sessions:
            summary = await self.get_segment_summary(store_id)
            return {
                "sessions_classified": 0,
                "segment_distribution": [d.model_dump() for d in summary.segments]
            }

        classified_count = 0
        results = []

        for sess in sessions:
            ev_stmt = select(AttentionEvent).where(AttentionEvent.session_id == str(sess.id))
            ev_res = await self.db.execute(ev_stmt)
            events = ev_res.scalars().all()

            seg_res = segmenter.classify_session(sess, events)
            results.append(seg_res)

            bs = BehaviorSegment(
                session_id=str(sess.id),
                store_id=str(store_id),
                segment_type=seg_res.segment_type.value,
                path_length_meters=seg_res.features.path_length_meters,
                total_store_dwell_seconds=seg_res.features.total_store_dwell_seconds,
                unique_zones_visited=seg_res.features.unique_zones_visited,
                avg_gaze_shifts_per_minute=seg_res.features.avg_gaze_shifts_per_minute,
                confidence_score=seg_res.confidence_score,
                classification_method=seg_res.classification_method
            )
            self.db.add(bs)
            classified_count += 1

        if classified_count > 0:
            await self.db.commit()

        dist = segmenter.get_segment_distribution(results)
        return {
            "sessions_classified": classified_count,
            "segment_distribution": [d.model_dump() for d in dist]
        }

    async def get_segment_summary(self, store_id: UUID, period: str = "week") -> StoreSegmentSummary:
        stmt = select(BehaviorSegment).where(BehaviorSegment.store_id == str(store_id))
        res = await self.db.execute(stmt)
        segments = res.scalars().all()

        total = len(segments)
        if total == 0:
            return StoreSegmentSummary(
                store_id=store_id,
                period=period,
                total_sessions=0,
                segments=[],
                most_common_segment="None"
            )

        counts: Dict[str, Dict[str, Any]] = {}
        for s in segments:
            st = s.segment_type
            if st not in counts:
                counts[st] = {"count": 0, "total_dwell": 0.0}
            counts[st]["count"] += 1
            counts[st]["total_dwell"] += s.total_store_dwell_seconds

        dist_list = []
        most_common = "None"
        max_cnt = -1

        for st, data in counts.items():
            cnt = data["count"]
            if cnt > max_cnt:
                max_cnt = cnt
                most_common = st
            pct = round((cnt / total) * 100, 2)
            avg_dwell = round(data["total_dwell"] / cnt if cnt > 0 else 0.0, 2)
            dist_list.append(
                SegmentDistribution(
                    segment_type=st,
                    count=cnt,
                    percentage=pct,
                    avg_dwell_seconds=avg_dwell
                )
            )

        return StoreSegmentSummary(
            store_id=store_id,
            period=period,
            total_sessions=total,
            segments=dist_list,
            most_common_segment=most_common
        )

    async def get_session_segment(self, session_id: UUID) -> BehaviorSegmentResponse:
        stmt = select(BehaviorSegment).where(BehaviorSegment.session_id == str(session_id))
        res = await self.db.execute(stmt)
        seg = res.scalars().first()
        if not seg:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Behavior segment not found for session")
        return BehaviorSegmentResponse.model_validate(seg)

    async def get_journey_analysis(self, session_id: UUID) -> Dict[str, Any]:
        stmt = select(ShopperSession).where(ShopperSession.id == str(session_id))
        res = await self.db.execute(stmt)
        sess = res.scalars().first()
        if not sess:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopper session not found")

        path_data = sess.path_data or []
        if isinstance(path_data, str):
            import json
            try:
                path_data = json.loads(path_data)
            except Exception:
                path_data = []

        analyzer = JourneyAnalyzer()
        metrics = analyzer.analyze_path(path_data)
        zones = analyzer.get_zone_sequence(path_data)
        hotspots = analyzer.get_hotspot_positions(path_data)
        entropy = analyzer.calculate_path_entropy(zones)

        return {
            "session_id": session_id,
            "metrics": metrics,
            "zone_sequence": zones,
            "hotspot_positions": hotspots,
            "path_entropy": entropy
        }
