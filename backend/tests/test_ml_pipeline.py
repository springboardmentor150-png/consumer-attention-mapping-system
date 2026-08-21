import pytest
import numpy as np
from app.ml.attention.head_pose import HeadPoseAttentionEstimator
from app.ml.behavior.segmenter import BehaviorSegmenter, BehaviorFeatures
from app.ml.scoring.product_scorer import ProductScorer, ProductMetrics
from app.ml.tracking.bytetrack_tracker import ByteTracker


def test_head_pose_estimator():
    estimator = HeadPoseAttentionEstimator()
    head_pose = estimator.estimate_head_pose(None, (0.1, 0.1, 0.3, 0.4))
    assert head_pose is not None
    assert hasattr(head_pose, "yaw")
    assert hasattr(head_pose, "pitch")
    assert hasattr(head_pose, "roll")
    assert isinstance(head_pose.is_estimated, bool)


def test_behavior_segmenter():
    segmenter = BehaviorSegmenter()

    explorer_features = BehaviorFeatures(
        total_dwell_time=450.0,
        zones_visited_count=5,
        products_viewed_count=12,
        interactions_count=6,
        movement_speed=0.3,
        repeat_visits=1,
        comparison_behavior=True,
        shelf_visits=8
    )
    result = segmenter.classify(explorer_features)
    assert result.segment in segmenter.SEGMENTS
    assert len(result.reason) > 0
    assert result.confidence > 0.0

    quick_features = BehaviorFeatures(
        total_dwell_time=60.0,
        zones_visited_count=1,
        products_viewed_count=1,
        interactions_count=1,
        movement_speed=0.8,
        repeat_visits=0,
        comparison_behavior=False,
        shelf_visits=1
    )
    quick_result = segmenter.classify(quick_features)
    assert quick_result.segment in segmenter.SEGMENTS


def test_bytetracker_persistent_person_id():
    """Test that ByteTracker maintains the EXACT SAME Person ID across all frames."""
    tracker = ByteTracker()
    tracker.reset()

    fake_frame = np.full((720, 1280, 3), 120, dtype=np.uint8)

    # Simulate Person 1 walking across 30 frames
    for frame_idx in range(1, 31):
        timestamp = frame_idx / 25.0
        # Smooth displacement
        x1 = 0.20 + (frame_idx * 0.008)
        y1 = 0.30 + (frame_idx * 0.004)
        x2 = x1 + 0.12
        y2 = y1 + 0.35

        detections = [{
            "bbox": (x1, y1, x2, y2),
            "center_x": (x1 + x2) / 2.0,
            "center_y": (y1 + y2) / 2.0,
            "conf": 0.92
        }]

        tracked = tracker.update(
            detections=detections,
            frame_number=frame_idx,
            timestamp=timestamp,
            frame_shape=(720, 1280),
            frame=fake_frame
        )

        assert len(tracked) == 1, f"Frame {frame_idx} should have 1 active tracked person"
        assert tracked[0].track_id == 1, f"Frame {frame_idx}: Person ID should remain 1, got {tracked[0].track_id}"
        assert tracked[0].shopper_code == "SHP-001"


def test_bytetracker_multi_person_distinct_ids():
    """Test that two people keep their distinct, invariant IDs across all frames without swapping."""
    tracker = ByteTracker()
    tracker.reset()

    fake_frame = np.full((720, 1280, 3), 150, dtype=np.uint8)

    for frame_idx in range(1, 40):
        timestamp = frame_idx / 25.0
        # Person 1 in left aisle
        p1_x1 = 0.15 + (frame_idx * 0.005)
        p1_y1 = 0.25
        # Person 2 in right aisle
        p2_x1 = 0.65 - (frame_idx * 0.004)
        p2_y1 = 0.35

        detections = [
            {
                "bbox": (p1_x1, p1_y1, p1_x1 + 0.10, p1_y1 + 0.30),
                "center_x": p1_x1 + 0.05,
                "center_y": p1_y1 + 0.15,
                "conf": 0.94
            },
            {
                "bbox": (p2_x1, p2_y1, p2_x1 + 0.10, p2_y1 + 0.32),
                "center_x": p2_x1 + 0.05,
                "center_y": p2_y1 + 0.16,
                "conf": 0.91
            }
        ]

        tracked = tracker.update(
            detections=detections,
            frame_number=frame_idx,
            timestamp=timestamp,
            frame_shape=(720, 1280),
            frame=fake_frame
        )

        assert len(tracked) == 2, f"Frame {frame_idx} should track both persons"
        ids = {t.track_id for t in tracked}
        assert ids == {1, 2}, f"Frame {frame_idx}: IDs should be exactly {{1, 2}}, got {ids}"


def test_product_scorer_partial_score():
    scorer = ProductScorer()
    metrics = ProductMetrics(
        product_id="prod-123",
        product_name="Test Beverage",
        total_views=10,
        total_attention_duration=45.0,
        interaction_count=4,
        pickup_count=2,
        has_purchase_data=False
    )
    res = scorer.score_product(metrics)
    assert res.is_partial is True
    assert "PARTIAL SCORE" in res.calculation_notes
    assert res.conversion_score is None
    assert 0.0 <= res.attractiveness_score <= 1.0


def test_product_scorer_full_score():
    scorer = ProductScorer()
    metrics = ProductMetrics(
        product_id="prod-456",
        product_name="Test Beverage Full",
        total_views=10,
        total_attention_duration=45.0,
        interaction_count=4,
        pickup_count=2,
        purchase_count=1,
        has_purchase_data=True
    )
    res = scorer.score_product(metrics)
    assert res.is_partial is False
    assert res.conversion_score is not None
    assert 0.0 <= res.attractiveness_score <= 1.0
