import uuid
from uuid import UUID
from datetime import datetime, timezone
from typing import List, Dict, Any
from app.models.attractiveness_score import ProductAttractivenessScore
from app.schemas.recommendation import (
    RecommendationItem,
    RecommendationType,
    PriorityLevel
)

class RecommendationEngine:
    def __init__(self):
        pass

    def generate_for_product(self, score: ProductAttractivenessScore, product_name: str = "Product", shelf_name: str = None) -> List[RecommendationItem]:
        recs = []
        now = datetime.now(timezone.utc)
        store_uuid = UUID(score.store_id) if isinstance(score.store_id, str) else score.store_id
        prod_uuid = UUID(score.product_id) if isinstance(score.product_id, str) else score.product_id
        shelf_uuid = UUID(score.shelf_id) if score.shelf_id else None

        att = score.attention_duration_score
        conv = score.conversion_rate_score
        pick = score.pickup_rate_score
        comp = score.composite_score
        rep = score.repeat_engagement_score
        inter = score.interaction_frequency_score

        # Rule 1: High Attention but Low Conversion -> Pricing Review
        if att > 80.0 and conv < 20.0:
            recs.append(
                RecommendationItem(
                    id=uuid.uuid4(),
                    store_id=store_uuid,
                    product_id=prod_uuid,
                    shelf_id=shelf_uuid,
                    recommendation_type=RecommendationType.PRICING_REVIEW,
                    priority=PriorityLevel.HIGH,
                    title="High Attention but Low Conversion",
                    description=f"Product '{product_name}' receives strong customer attention ({att:.0f}%) but very few purchases ({conv:.0f}%). Consider reviewing the price point or adding a promotional label.",
                    trigger_reason="Attention score above 80 with conversion below 20",
                    suggested_action="Review pricing strategy or add promotional offer",
                    expected_impact="Expected 15-25% improvement in conversion rate",
                    composite_score_before=comp,
                    is_active=True,
                    created_at=now
                )
            )

        # Rule 2: Frequent Pickups but Low Purchase Rate -> Promotional Placement
        if pick > 60.0 and conv < 30.0:
            recs.append(
                RecommendationItem(
                    id=uuid.uuid4(),
                    store_id=store_uuid,
                    product_id=prod_uuid,
                    shelf_id=shelf_uuid,
                    recommendation_type=RecommendationType.PROMOTIONAL_PLACEMENT,
                    priority=PriorityLevel.HIGH,
                    title="Frequent Pickups but Low Purchase Rate",
                    description=f"Shoppers frequently pick up '{product_name}' ({pick:.0f}%) but rarely purchase it. A bundle deal or loyalty discount may convert interest into sales.",
                    trigger_reason="Pickup rate above 60 with low conversion",
                    suggested_action="Introduce bundle pricing or loyalty discount",
                    expected_impact="Expected 20% increase in purchase conversion",
                    composite_score_before=comp,
                    is_active=True,
                    created_at=now
                )
            )

        # Rule 3: Low Visibility Product -> Product Placement
        if comp < 35.0 and att < 30.0:
            recs.append(
                RecommendationItem(
                    id=uuid.uuid4(),
                    store_id=store_uuid,
                    product_id=prod_uuid,
                    shelf_id=shelf_uuid,
                    recommendation_type=RecommendationType.PRODUCT_PLACEMENT,
                    priority=PriorityLevel.MEDIUM,
                    title="Low Visibility Product",
                    description=f"'{product_name}' is not attracting customer attention. Consider moving it to a higher-traffic shelf location or improving signage.",
                    trigger_reason="Composite score below 35 and attention below 30",
                    suggested_action="Relocate product to eye-level shelf in high-traffic zone",
                    expected_impact="Expected 30-40% improvement in visibility",
                    composite_score_before=comp,
                    is_active=True,
                    created_at=now
                )
            )

        # Rule 4: Top Performing Product — Expand Presence -> Shelf Optimization
        if rep > 70.0 and comp > 75.0:
            recs.append(
                RecommendationItem(
                    id=uuid.uuid4(),
                    store_id=store_uuid,
                    product_id=prod_uuid,
                    shelf_id=shelf_uuid,
                    recommendation_type=RecommendationType.SHELF_OPTIMIZATION,
                    priority=PriorityLevel.LOW,
                    title="Top Performing Product — Expand Presence",
                    description=f"'{product_name}' consistently engages returning customers ({rep:.0f}%). Consider expanding shelf space or creating a dedicated display section.",
                    trigger_reason="High repeat engagement and composite score above 75",
                    suggested_action="Expand shelf allocation and consider end-cap display",
                    expected_impact="Maintain and grow strong performance",
                    composite_score_before=comp,
                    is_active=True,
                    created_at=now
                )
            )

        # Rule 5: Noticed but Not Engaged -> Engagement Boost
        if att > 50.0 and inter < 20.0:
            recs.append(
                RecommendationItem(
                    id=uuid.uuid4(),
                    store_id=store_uuid,
                    product_id=prod_uuid,
                    shelf_id=shelf_uuid,
                    recommendation_type=RecommendationType.ENGAGEMENT_BOOST,
                    priority=PriorityLevel.MEDIUM,
                    title="Noticed but Not Engaged",
                    description=f"Customers look at '{product_name}' ({att:.0f}%) but rarely interact with it physically. Improving packaging visibility or adding product testers may increase engagement.",
                    trigger_reason="Attention above 50 but interaction frequency below 20",
                    suggested_action="Review packaging design or add product tester/sample",
                    expected_impact="Expected 25% increase in physical interaction rate",
                    composite_score_before=comp,
                    is_active=True,
                    created_at=now
                )
            )

        return recs

    def generate_store_recommendations(self, scores: List[ProductAttractivenessScore], products_map: Dict[str, str] = None) -> List[RecommendationItem]:
        products_map = products_map or {}
        all_recs = []
        for s in scores:
            pname = products_map.get(str(s.product_id), f"Product-{str(s.product_id)[:6]}")
            r_list = self.generate_for_product(s, product_name=pname)
            all_recs.extend(r_list)

        # Sort priority high first
        priority_order = {PriorityLevel.HIGH: 0, PriorityLevel.MEDIUM: 1, PriorityLevel.LOW: 2}
        all_recs.sort(key=lambda x: priority_order.get(x.priority, 3))
        return all_recs

    def generate_zone_recommendations(self, zone_traffic: List[Dict[str, Any]]) -> List[RecommendationItem]:
        recs = []
        if not zone_traffic:
            return recs

        avg_v = sum(z.get("total_visitors", 0) for z in zone_traffic) / len(zone_traffic)
        now = datetime.now(timezone.utc)

        for z in zone_traffic:
            v = z.get("total_visitors", 0)
            if v < 0.1 * avg_v and avg_v > 5:
                z_name = z.get("zone_name", "Zone")
                store_uuid = UUID(z["store_id"]) if "store_id" in z and isinstance(z["store_id"], str) else uuid.uuid4()
                z_uuid = UUID(z["zone_id"]) if "zone_id" in z and isinstance(z["zone_id"], str) else None

                recs.append(
                    RecommendationItem(
                        id=uuid.uuid4(),
                        store_id=store_uuid,
                        zone_id=z_uuid,
                        recommendation_type=RecommendationType.LAYOUT_IMPROVEMENT,
                        priority=PriorityLevel.MEDIUM,
                        title=f"Low Traffic Zone — {z_name}",
                        description=f"Zone '{z_name}' has significantly lower foot traffic than average. Consider adjusting aisle flow or adding promotional signage to draw traffic.",
                        trigger_reason="Zone traffic below 10% of store average",
                        suggested_action="Adjust store aisle layout or add directional signage",
                        expected_impact="Expected 15% increase in zone foot traffic",
                        is_active=True,
                        created_at=now
                    )
                )
        return recs

    def get_priority_counts(self, recommendations: List[RecommendationItem]) -> Dict[str, int]:
        counts = {"high": 0, "medium": 0, "low": 0}
        for r in recommendations:
            p_val = r.priority.value if hasattr(r.priority, "value") else str(r.priority)
            counts[p_val] = counts.get(p_val, 0) + 1
        return counts
