"""
Recommendation Engine
Generates data-driven retail optimization recommendations from PostgreSQL analytics.
All recommendations include: type, text, reason, supporting_metric, confidence, expected_impact.
No random recommendations — all based on actual data thresholds.
"""

import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone

from ..models import (
    Store, Shelf, Product, StoreZone,
    AttentionEvent, ProductScore, ProductInteraction,
    ShopperSession, TrackingPoint, Recommendation
)

logger = logging.getLogger(__name__)

# Recommendation thresholds
LOW_ATTENTION_THRESHOLD = 30.0          # seconds avg attention below this = low performer
HIGH_ATTENTION_THRESHOLD = 120.0
LOW_TRAFFIC_ZONE_THRESHOLD = 5          # fewer than 5 shoppers = low traffic zone
HIGH_TRAFFIC_ZONE_THRESHOLD = 50
LOW_ATTRACTIVENESS_THRESHOLD = 0.3
HIGH_ATTRACTIVENESS_THRESHOLD = 0.7
MIN_CONFIDENCE = 0.6


class RecommendationEngine:
    """
    Rule-based recommendation engine using real PostgreSQL data.
    Generates actionable retail optimization recommendations.
    """

    def generate_for_store(self, db: Session, store_id: str) -> List[Recommendation]:
        """Generate all recommendations for a store."""
        existing = db.query(Recommendation).filter(
            Recommendation.store_id == store_id,
            Recommendation.is_dismissed == False
        ).count()

        # Clear stale recommendations (older than 7 days) before generating new
        from datetime import timedelta
        cutoff = datetime.now(timezone.utc).replace(tzinfo=None)
        db.query(Recommendation).filter(
            Recommendation.store_id == store_id,
            Recommendation.created_at < datetime.utcnow() - timedelta(days=7)
        ).delete()
        db.flush()

        recommendations = []
        recommendations += self._low_attention_shelf_recs(db, store_id)
        recommendations += self._high_performing_relocation_recs(db, store_id)
        recommendations += self._low_traffic_zone_recs(db, store_id)
        recommendations += self._product_visibility_recs(db, store_id)
        recommendations += self._promotional_placement_recs(db, store_id)

        for rec in recommendations:
            rec.store_id = store_id
            db.add(rec)

        db.commit()
        logger.info(f"Generated {len(recommendations)} recommendations for store {store_id}")
        return recommendations

    def _low_attention_shelf_recs(self, db: Session, store_id: str) -> List[Recommendation]:
        """Identify shelves with below-average attention and recommend improvements."""
        recs = []

        shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
        for shelf in shelves:
            # Calculate average attention duration for this shelf
            avg_attention = db.query(
                func.avg(AttentionEvent.duration)
            ).filter(
                AttentionEvent.shelf_id == str(shelf.shelf_id)
            ).scalar() or 0.0

            if 0 < avg_attention < LOW_ATTENTION_THRESHOLD:
                rec = Recommendation(
                    recommendation_type="improve_shelf_visibility",
                    recommendation_text=(
                        f"Improve visibility of shelf '{shelf.shelf_name}' "
                        f"in category '{shelf.category}'"
                    ),
                    reason=(
                        f"Average shopper attention on this shelf is {avg_attention:.1f}s, "
                        f"which is below the target threshold of {LOW_ATTENTION_THRESHOLD}s. "
                        f"Low attention may indicate poor product placement, blocked sightlines, "
                        f"or inadequate signage."
                    ),
                    supporting_metric=f"Average attention: {avg_attention:.1f}s",
                    confidence=0.78,
                    expected_impact=(
                        f"Improving shelf visibility could increase attention by 20-40%, "
                        f"potentially lifting product engagement by 15-25%."
                    ),
                    shelf_id=str(shelf.shelf_id)
                )
                recs.append(rec)

        return recs[:3]  # Limit to top 3

    def _high_performing_relocation_recs(self, db: Session, store_id: str) -> List[Recommendation]:
        """Recommend moving high-score products to more prominent locations."""
        recs = []

        # Find high-scoring products on low-visibility shelves
        high_score_products = db.query(ProductScore).join(
            Product, ProductScore.product_id == Product.product_id
        ).join(
            Shelf, Product.shelf_id == Shelf.shelf_id
        ).filter(
            Shelf.store_id == store_id,
            ProductScore.attractiveness_score >= HIGH_ATTRACTIVENESS_THRESHOLD
        ).all()

        for score in high_score_products[:2]:
            product = db.query(Product).filter(
                Product.product_id == score.product_id
            ).first()
            if not product:
                continue

            shelf = db.query(Shelf).filter(
                Shelf.shelf_id == product.shelf_id
            ).first()
            if not shelf:
                continue

            rec = Recommendation(
                recommendation_type="promote_high_performer",
                recommendation_text=(
                    f"Move '{product.product_name}' to a more prominent "
                    f"shelf location (eye-level or end-cap)"
                ),
                reason=(
                    f"'{product.product_name}' has a high attractiveness score of "
                    f"{score.attractiveness_score:.2f} but may not be in an optimal "
                    f"shelf position. High-scoring products should be featured prominently."
                ),
                supporting_metric=(
                    f"Attractiveness score: {score.attractiveness_score:.2f} | "
                    f"Attention: {score.attention_score:.2f} | "
                    f"Interaction: {score.interaction_score:.2f}"
                ),
                confidence=0.82,
                expected_impact=(
                    "Moving to eye-level placement typically increases sales 15-30% "
                    "for high-attention products."
                ),
                product_id=str(product.product_id),
                shelf_id=str(shelf.shelf_id)
            )
            recs.append(rec)

        return recs

    def _low_traffic_zone_recs(self, db: Session, store_id: str) -> List[Recommendation]:
        """Identify zones with low shopper traffic."""
        recs = []

        zones = db.query(StoreZone).filter(StoreZone.store_id == store_id).all()
        for zone in zones:
            if not zone.coordinates:
                continue

            # Count shoppers who visited this zone (cast JSON to String for PostgreSQL compatibility)
            from sqlalchemy import cast, String
            zone_sessions = db.query(ShopperSession).filter(
                cast(ShopperSession.zones_visited, String).like(f"%{zone.zone_id}%")
            ).count()

            # Use a simple count via tracking points as fallback
            if zone_sessions == 0:
                zone_sessions = db.query(TrackingPoint).filter(
                    TrackingPoint.zone_id == str(zone.zone_id)
                ).distinct(TrackingPoint.session_id).count()

            if 0 < zone_sessions < LOW_TRAFFIC_ZONE_THRESHOLD:
                rec = Recommendation(
                    recommendation_type="improve_zone_traffic",
                    recommendation_text=(
                        f"Increase shopper traffic to zone '{zone.zone_name}' "
                        f"through improved store layout or promotional signage"
                    ),
                    reason=(
                        f"Zone '{zone.zone_name}' had only {zone_sessions} shopper visits. "
                        f"This zone may be poorly positioned, blocked, or lacking visual cues "
                        f"to attract shoppers."
                    ),
                    supporting_metric=f"Shopper visits to zone: {zone_sessions}",
                    confidence=0.72,
                    expected_impact=(
                        "Improving zone visibility through signage or layout changes "
                        "typically increases traffic by 20-35%."
                    )
                )
                recs.append(rec)

        return recs[:2]

    def _product_visibility_recs(self, db: Session, store_id: str) -> List[Recommendation]:
        """Recommend improving visibility for low-scoring products."""
        recs = []

        low_score_products = db.query(ProductScore).join(
            Product, ProductScore.product_id == Product.product_id
        ).join(
            Shelf, Product.shelf_id == Shelf.shelf_id
        ).filter(
            Shelf.store_id == store_id,
            ProductScore.attractiveness_score > 0,
            ProductScore.attractiveness_score < LOW_ATTRACTIVENESS_THRESHOLD
        ).all()

        for score in low_score_products[:2]:
            product = db.query(Product).filter(
                Product.product_id == score.product_id
            ).first()
            if not product:
                continue

            rec = Recommendation(
                recommendation_type="improve_product_visibility",
                recommendation_text=(
                    f"Reposition or add prominent signage for '{product.product_name}'"
                ),
                reason=(
                    f"'{product.product_name}' has a low attractiveness score of "
                    f"{score.attractiveness_score:.2f}. Contributing factors: "
                    f"low attention ({score.attention_score:.2f}), "
                    f"low interaction ({score.interaction_score:.2f})."
                ),
                supporting_metric=f"Attractiveness score: {score.attractiveness_score:.2f}",
                confidence=0.70,
                expected_impact=(
                    "Adding signage or repositioning can increase product attention "
                    "by 25-40% for low-visibility products."
                ),
                product_id=str(product.product_id)
            )
            recs.append(rec)

        return recs

    def _promotional_placement_recs(self, db: Session, store_id: str) -> List[Recommendation]:
        """Recommend promotional placement for high-traffic areas."""
        recs = []

        # Find zones with highest traffic
        from ..models import Video
        sessions = db.query(ShopperSession).join(
            Video,
            ShopperSession.video_id == Video.video_id
        ).filter(
            Video.store_id == store_id
        ).all()

        zone_traffic: dict = {}
        for session in sessions:
            if not session.zones_visited:
                continue
            for zone_info in session.zones_visited:
                zid = zone_info.get("zone_id")
                if zid:
                    zone_traffic[zid] = zone_traffic.get(zid, 0) + 1

        if zone_traffic:
            top_zone_id = max(zone_traffic, key=zone_traffic.get)
            top_count = zone_traffic[top_zone_id]
            zone = db.query(StoreZone).filter(
                StoreZone.zone_id == top_zone_id
            ).first()

            if zone and top_count >= 5:
                rec = Recommendation(
                    recommendation_type="promotional_placement",
                    recommendation_text=(
                        f"Place promotional displays in '{zone.zone_name}' "
                        f"— the highest traffic zone"
                    ),
                    reason=(
                        f"Zone '{zone.zone_name}' receives the highest shopper traffic "
                        f"({top_count} visits). Promotional displays in high-traffic areas "
                        f"maximize exposure and conversion potential."
                    ),
                    supporting_metric=f"Shopper visits: {top_count}",
                    confidence=0.85,
                    expected_impact=(
                        "Promotional displays in peak traffic zones typically show "
                        "15-25% higher engagement than standard shelf placement."
                    )
                )
                recs.append(rec)

        return recs


_engine: Optional[RecommendationEngine] = None


def get_recommendation_engine() -> RecommendationEngine:
    global _engine
    if _engine is None:
        _engine = RecommendationEngine()
    return _engine
