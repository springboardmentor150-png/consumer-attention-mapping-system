import math
import numpy as np
from uuid import UUID
from typing import List, Dict, Any, Tuple
from sklearn.cluster import KMeans

from app.models.shopper_session import ShopperSession
from app.models.attention_event import AttentionEvent
from app.schemas.behavior import (
    ShopperFeatures,
    SegmentationResult,
    SegmentType,
    SegmentDistribution
)

class ShopperSegmenter:
    def __init__(self):
        self.kmeans: KMeans = None
        self.is_fitted: bool = False
        self._cluster_map = {
            0: SegmentType.EXPLORER,
            1: SegmentType.QUICK_BUYER,
            2: SegmentType.COMPARISON_SHOPPER,
            3: SegmentType.IMPULSE_BUYER,
            4: SegmentType.BRAND_LOYAL
        }

    def _extract_features(self, session: ShopperSession, attention_events: List[AttentionEvent]) -> ShopperFeatures:
        path_data = session.path_data or []
        if isinstance(path_data, str):
            import json
            try:
                path_data = json.loads(path_data)
            except Exception:
                path_data = []

        # Calculate Euclidean distance across path coordinates
        path_length = 0.0
        for i in range(1, len(path_data)):
            p1, p2 = path_data[i - 1], path_data[i]
            x1, y1 = p1.get("x", 0), p1.get("y", 0)
            x2, y2 = p2.get("x", 0), p2.get("y", 0)
            path_length += math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)

        total_dwell = float(session.total_dwell_time_seconds or 0.0)

        # Count unique non-None zone IDs
        zones = set()
        for p in path_data:
            zid = p.get("zone_id")
            if zid:
                zones.add(str(zid))
        unique_zones = len(zones)

        # Count gaze shifts
        gaze_events = sum(1 for e in attention_events if e.is_looking_at_shelf or e.event_type == "gaze_start")
        dwell_minutes = total_dwell / 60.0 if total_dwell > 0 else 1.0
        avg_gaze_shifts = gaze_events / max(dwell_minutes, 0.1)

        sess_uuid = UUID(session.id) if isinstance(session.id, str) else session.id

        return ShopperFeatures(
            session_id=sess_uuid,
            path_length_meters=round(path_length, 2),
            total_store_dwell_seconds=round(total_dwell, 2),
            unique_zones_visited=unique_zones,
            avg_gaze_shifts_per_minute=round(avg_gaze_shifts, 2)
        )

    def _rule_based_classify(self, features: ShopperFeatures) -> Tuple[SegmentType, float]:
        length = features.path_length_meters
        dwell = features.total_store_dwell_seconds
        zones = features.unique_zones_visited
        gaze_shifts = features.avg_gaze_shifts_per_minute

        if length > 50 and dwell > 300:
            return SegmentType.EXPLORER, 0.85
        elif dwell < 120 and length < 20:
            return SegmentType.QUICK_BUYER, 0.80
        elif gaze_shifts > 5 and zones < 3 and dwell > 180:
            return SegmentType.COMPARISON_SHOPPER, 0.75
        elif 60 <= dwell <= 180 and length < 30:
            return SegmentType.IMPULSE_BUYER, 0.70
        else:
            return SegmentType.BRAND_LOYAL, 0.65

    def classify_session(self, session: ShopperSession, attention_events: List[AttentionEvent]) -> SegmentationResult:
        features = self._extract_features(session, attention_events)
        segment_type, confidence = self._rule_based_classify(features)
        
        return SegmentationResult(
            session_id=features.session_id,
            segment_type=segment_type,
            confidence_score=confidence,
            classification_method="rule_based",
            features=features
        )

    def classify_batch(self, sessions: List[ShopperSession], events_map: Dict[str, List[AttentionEvent]]) -> List[SegmentationResult]:
        results = []
        for sess in sessions:
            events = events_map.get(str(sess.id), [])
            results.append(self.classify_session(sess, events))
        return results

    def get_segment_distribution(self, results: List[SegmentationResult]) -> List[SegmentDistribution]:
        total = len(results)
        if total == 0:
            return []

        counts: Dict[str, Dict[str, Any]] = {
            st.value: {"count": 0, "total_dwell": 0.0} for st in SegmentType
        }

        for r in results:
            st = r.segment_type.value
            counts[st]["count"] += 1
            counts[st]["total_dwell"] += r.features.total_store_dwell_seconds

        dist = []
        for st_name, data in counts.items():
            cnt = data["count"]
            pct = round((cnt / total) * 100, 2)
            avg_dwell = round(data["total_dwell"] / cnt if cnt > 0 else 0.0, 2)
            dist.append(
                SegmentDistribution(
                    segment_type=st_name,
                    count=cnt,
                    percentage=pct,
                    avg_dwell_seconds=avg_dwell
                )
            )
        return dist

    def fit_kmeans(self, features_matrix: np.ndarray):
        if len(features_matrix) < 5:
            return
        self.kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
        self.kmeans.fit(features_matrix)
        self.is_fitted = True

    def classify_with_kmeans(self, features: ShopperFeatures) -> SegmentType:
        if not self.is_fitted or self.kmeans is None:
            st, _ = self._rule_based_classify(features)
            return st
        
        feat_vec = np.array([[
            features.path_length_meters,
            features.total_store_dwell_seconds,
            features.unique_zones_visited,
            features.avg_gaze_shifts_per_minute
        ]])
        cluster_idx = int(self.kmeans.predict(feat_vec)[0])
        return self._cluster_map.get(cluster_idx, SegmentType.BRAND_LOYAL)
