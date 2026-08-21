import sys
import os
import argparse
import uuid
from uuid import UUID
from datetime import datetime, timezone

# Ensure app package is importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.behavior.segmenter import ShopperSegmenter
from app.services.behavior.journey_analyzer import JourneyAnalyzer
from app.services.scoring.attractiveness_scorer import ProductAttractivenessScorer
from app.services.recommendations.engine import RecommendationEngine
from app.models.shopper_session import ShopperSession
from app.models.attention_event import AttentionEvent

def create_synthetic_sessions(store_id_str: str):
    """Generates synthetic sessions covering all 5 behavioral segment types."""
    sessions = []
    events_map = {}

    # 1. Explorer (long path > 50m, long dwell > 300s)
    s1_id = str(uuid.uuid4())
    path1 = [{"x": i * 3, "y": (i * 2) % 30, "zone_id": f"zone_{i%4+1}"} for i in range(25)]
    sess1 = ShopperSession(
        id=s1_id,
        store_id=store_id_str,
        camera_id=str(uuid.uuid4()),
        anonymous_id="shopper_explorer_01",
        total_dwell_time_seconds=380.0,
        path_data=path1,
        is_active=False
    )
    events1 = [AttentionEvent(session_id=s1_id, is_looking_at_shelf=True, attention_duration_seconds=5.0) for _ in range(8)]
    sessions.append(sess1)
    events_map[s1_id] = events1

    # 2. Quick Buyer (short path < 20m, fast dwell < 120s)
    s2_id = str(uuid.uuid4())
    path2 = [{"x": i * 2, "y": 5, "zone_id": "zone_1"} for i in range(5)]
    sess2 = ShopperSession(
        id=s2_id,
        store_id=store_id_str,
        camera_id=str(uuid.uuid4()),
        anonymous_id="shopper_quick_02",
        total_dwell_time_seconds=85.0,
        path_data=path2,
        is_active=False
    )
    events2 = [AttentionEvent(session_id=s2_id, is_looking_at_shelf=True, attention_duration_seconds=2.0) for _ in range(2)]
    sessions.append(sess2)
    events_map[s2_id] = events2

    # 3. Comparison Shopper (high gaze shifts > 5/min, low zones < 3, long dwell > 180s)
    s3_id = str(uuid.uuid4())
    path3 = [{"x": 10 + i, "y": 10, "zone_id": "zone_2"} for i in range(8)]
    sess3 = ShopperSession(
        id=s3_id,
        store_id=store_id_str,
        camera_id=str(uuid.uuid4()),
        anonymous_id="shopper_comparison_03",
        total_dwell_time_seconds=240.0,
        path_data=path3,
        is_active=False
    )
    # 25 gaze events in 4 minutes = 6.25 gaze shifts / min
    events3 = [AttentionEvent(session_id=s3_id, is_looking_at_shelf=True, event_type="gaze_start", attention_duration_seconds=4.0) for _ in range(25)]
    sessions.append(sess3)
    events_map[s3_id] = events3

    # 4. Impulse Buyer (dwell 60-180s, path < 30m)
    s4_id = str(uuid.uuid4())
    path4 = [{"x": i * 2.5, "y": i, "zone_id": f"zone_{i%2+1}"} for i in range(10)]
    sess4 = ShopperSession(
        id=s4_id,
        store_id=store_id_str,
        camera_id=str(uuid.uuid4()),
        anonymous_id="shopper_impulse_04",
        total_dwell_time_seconds=140.0,
        path_data=path4,
        is_active=False
    )
    events4 = [AttentionEvent(session_id=s4_id, is_looking_at_shelf=True, attention_duration_seconds=3.0) for _ in range(5)]
    sessions.append(sess4)
    events_map[s4_id] = events4

    # 5. Brand Loyal (targeted path, high repeat engagement)
    s5_id = str(uuid.uuid4())
    path5 = [{"x": 15, "y": i * 4, "zone_id": "zone_3"} for i in range(10)]
    sess5 = ShopperSession(
        id=s5_id,
        store_id=store_id_str,
        camera_id=str(uuid.uuid4()),
        anonymous_id="shopper_loyal_05",
        total_dwell_time_seconds=210.0,
        path_data=path5,
        is_active=False
    )
    events5 = [AttentionEvent(session_id=s5_id, is_looking_at_shelf=True, attention_duration_seconds=6.0) for _ in range(4)]
    sessions.append(sess5)
    events_map[s5_id] = events5

    return sessions, events_map

def main():
    parser = argparse.ArgumentParser(description="CAMS Milestone 3 Behavior & Recommendations Demo Script")
    parser.add_argument("--store-id", type=str, default=str(uuid.uuid4()), help="Target Store UUID string")
    parser.add_argument("--method", type=str, choices=["rule_based", "kmeans"], default="rule_based", help="Segmentation classification method")
    args = parser.parse_args()

    print("=" * 80)
    print(f" CAMS BEHAVIORAL INTELLIGENCE & RECOMMENDATION ENGINE DEMO ")
    print(f" Target Store ID: {args.store_id}")
    print(f" Classification Method: {args.method}")
    print("=" * 80)

    # 1. Behavioral Segmentation Demo
    print("\n[1/3] RUNNING SHOPPER BEHAVIORAL SEGMENTATION...")
    sessions, events_map = create_synthetic_sessions(args.store_id)
    segmenter = ShopperSegmenter()

    results = segmenter.classify_batch(sessions, events_map)

    print("-" * 85)
    print(f"{'Session ID':<38} | {'Path (m)':<8} | {'Dwell (s)':<9} | {'Zones':<5} | {'Segment':<18} | {'Conf':<4}")
    print("-" * 85)
    for r in results:
        f = r.features
        print(f"{str(f.session_id):<38} | {f.path_length_meters:<8.1f} | {f.total_store_dwell_seconds:<9.1f} | {f.unique_zones_visited:<5} | {r.segment_type.value:<18} | {r.confidence_score:<4.2f}")
    print("-" * 85)

    dist = segmenter.get_segment_distribution(results)
    print("\nSegment Distribution Summary:")
    for d in dist:
        print(f"  • {d.segment_type.replace('_', ' ').title():<20}: {d.count} shoppers ({d.percentage:.1f}%) | Avg Dwell: {d.avg_dwell_seconds:.1f}s")

    # 2. Product Attractiveness Scoring Demo
    print("\n[2/3] CALCULATING PRODUCT ATTRACTIVENESS SCORES...")
    scorer = ProductAttractivenessScorer()

    sample_products = [
        {"product_id": uuid.uuid4(), "name": "Organic Almond Milk", "att": {"avg_attention_seconds": 28.0, "total_viewers": 45}, "inter": {"total_interactions": 60, "total_pickups": 35, "total_purchases": 8, "repeat_viewers": 5}}, # High attention low conversion
        {"product_id": uuid.uuid4(), "name": "Premium Energy Drink", "att": {"avg_attention_seconds": 22.0, "total_viewers": 50}, "inter": {"total_interactions": 40, "total_pickups": 32, "total_purchases": 5, "repeat_viewers": 3}}, # Frequent pickups low sales
        {"product_id": uuid.uuid4(), "name": "Generic Paper Towels", "att": {"avg_attention_seconds": 6.0, "total_viewers": 10}, "inter": {"total_interactions": 5, "total_pickups": 2, "total_purchases": 1, "repeat_viewers": 1}},   # Low visibility
        {"product_id": uuid.uuid4(), "name": "Artisanal Dark Chocolate", "att": {"avg_attention_seconds": 25.0, "total_viewers": 60}, "inter": {"total_interactions": 70, "total_pickups": 55, "total_purchases": 45, "repeat_viewers": 25}}, # Top performer
    ]

    scores = []
    prod_map = {}
    print("-" * 85)
    print(f"{'Product Name':<28} | {'Attn Score':<10} | {'Pick Score':<10} | {'Conv Score':<10} | {'Composite':<9} | {'Grade'}")
    print("-" * 85)
    for p in sample_products:
        s = scorer.score_product(p["product_id"], UUID(args.store_id), attention_data=p["att"], interaction_data=p["inter"])
        scores.append(s)
        prod_map[str(p["product_id"])] = p["name"]
        print(f"{p['name']:<28} | {s.attention_duration_score:<10.1f} | {s.pickup_rate_score:<10.1f} | {s.conversion_rate_score:<10.1f} | {s.composite_score:<9.1f} | {s.grade}")
    print("-" * 85)

    # 3. Recommendation Engine Demo
    print("\n[3/3] GENERATING AUTOMATED BUSINESS RECOMMENDATIONS...")
    engine = RecommendationEngine()
    recs = engine.generate_store_recommendations(scores, prod_map)

    print(f"Generated {len(recs)} Actionable Recommendations:\n")
    for idx, r in enumerate(recs, 1):
        p_badge = f"[{r.priority.value.upper()}]" if hasattr(r.priority, "value") else f"[{str(r.priority).upper()}]"
        print(f"  {idx}. {p_badge} {r.title}")
        print(f"     Trigger Reason  : {r.trigger_reason}")
        print(f"     Suggested Action: {r.suggested_action}")
        print(f"     Expected Impact : {r.expected_impact}\n")

    print("=" * 80)
    print(" MILESTONE 3 BEHAVIOR & RECOMMENDATION DEMO COMPLETED SUCCESSFULLY! ")
    print("=" * 80)

if __name__ == "__main__":
    main()
