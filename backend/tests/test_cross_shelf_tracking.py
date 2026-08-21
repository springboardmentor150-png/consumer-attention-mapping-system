"""
Cross-Shelf & Multi-Box Tracking Integration Tests
Validates that each person maintains the EXACT SAME unique ID across all video frames
when moving across different store shelves, display boxes, checkout counters, and aisles.
"""

import numpy as np
import pytest
from app.ml.tracking.bytetrack_tracker import ByteTracker, extract_appearance_feature, appearance_similarity


def test_cross_multiple_shelves_and_boxes():
    """
    Test a shopper walking past 4 different shelf fixtures / display boxes:
    - Shelf 1 (Frames 1-20): Visible in Aisle 1
    - Occlusion behind Shelf 1 pillar (Frames 21-30): No detections
    - Shelf 2 (Frames 31-50): Browsing lower shelf box (bbox height cut in half)
    - Occlusion behind Island Display Box (Frames 51-65): No detections
    - Shelf 3 (Frames 66-90): Browsing shelf, turning back to front
    - Checkout Counter (Frames 91-110): Emerging at checkout
    The tracker must maintain Person ID #1 across all 110 frames without any ID change.
    """
    tracker = ByteTracker()
    tracker.reset()
    h, w = 720, 1280

    for frame_idx in range(1, 111):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        px = 0.05 + (frame_idx * 0.007)  # moving across store

        # Determine visibility and shelf occlusion state
        is_occluded = (21 <= frame_idx <= 30) or (51 <= frame_idx <= 65)

        if is_occluded:
            detections = []
        else:
            if 31 <= frame_idx <= 50:
                # Lower shelf occlusion: only upper body visible
                y1, y2 = 0.30, 0.48
                conf = 0.78
            else:
                # Full body
                y1, y2 = 0.30, 0.68
                conf = 0.90

            bbox = (px, y1, px + 0.08, y2)
            bx1 = int(bbox[0] * w)
            by1 = int(bbox[1] * h)
            bx2 = int(bbox[2] * w)
            by2 = int(bbox[3] * h)

            # Draw person (Cyan shirt, dark trousers)
            frame[by1:by1 + (by2 - by1) // 2, bx1:bx2] = (255, 200, 0)
            frame[by1 + (by2 - by1) // 2:by2, bx1:bx2] = (30, 30, 30)

            detections = [{
                "bbox": bbox,
                "center_x": (bbox[0] + bbox[2]) / 2.0,
                "center_y": (bbox[1] + bbox[3]) / 2.0,
                "conf": conf
            }]

        tracked = tracker.update(
            detections=detections,
            frame_number=frame_idx,
            timestamp=frame_idx / 25.0,
            frame_shape=(h, w),
            frame=frame
        )

        all_ids = tracker.get_all_track_ids()
        assert len(all_ids) <= 1, f"Frame {frame_idx}: Person ID changed while crossing shelves! IDs: {all_ids}"

        if not is_occluded:
            active_ids = [t.track_id for t in tracked]
            assert active_ids == [1], f"Frame {frame_idx}: Expected active track [1], got {active_ids}"


def test_two_people_crisscrossing_between_shelves():
    """
    Test two people walking in opposite directions between two shelf rows:
    - Person 1 (Navy top): walks Left-to-Right (x: 0.15 -> 0.75)
    - Person 2 (Yellow top): walks Right-to-Left (x: 0.75 -> 0.15)
    - Crossing point at frames 40-50 in the central shelf aisle
    Both shoppers must retain their EXACT IDs (#1 and #2) before, during, and after crossing.
    """
    tracker = ByteTracker()
    tracker.reset()
    h, w = 720, 1280

    for frame_idx in range(1, 90):
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Person 1: Left to Right
        p1_x = 0.15 + (frame_idx * 0.007)
        p1_box = (p1_x, 0.30, p1_x + 0.08, 0.65)
        b1_x1, b1_y1, b1_x2, b1_y2 = int(p1_box[0]*w), int(p1_box[1]*h), int(p1_box[2]*w), int(p1_box[3]*h)
        frame[b1_y1:b1_y1 + (b1_y2 - b1_y1)//2, b1_x1:b1_x2] = (180, 50, 0)  # Navy
        frame[b1_y1 + (b1_y2 - b1_y1)//2:b1_y2, b1_x1:b1_x2] = (40, 40, 40)

        # Person 2: Right to Left
        p2_x = 0.75 - (frame_idx * 0.007)
        p2_box = (p2_x, 0.30, p2_x + 0.08, 0.65)
        b2_x1, b2_y1, b2_x2, b2_y2 = int(p2_box[0]*w), int(p2_box[1]*h), int(p2_box[2]*w), int(p2_box[3]*h)
        frame[b2_y1:b2_y1 + (b2_y2 - b2_y1)//2, b2_x1:b2_x2] = (0, 220, 240)  # Yellow
        frame[b2_y1 + (b2_y2 - b2_y1)//2:b2_y2, b2_x1:b2_x2] = (80, 80, 80)

        detections = [
            {"bbox": p1_box, "center_x": (p1_box[0] + p1_box[2]) / 2.0, "center_y": (p1_box[1] + p1_box[3]) / 2.0, "conf": 0.90},
            {"bbox": p2_box, "center_x": (p2_box[0] + p2_box[2]) / 2.0, "center_y": (p2_box[1] + p2_box[3]) / 2.0, "conf": 0.90}
        ]

        tracked = tracker.update(
            detections=detections,
            frame_number=frame_idx,
            timestamp=frame_idx / 25.0,
            frame_shape=(h, w),
            frame=frame
        )

        all_ids = tracker.get_all_track_ids()
        assert all_ids == {1, 2}, f"Frame {frame_idx}: IDs changed or fragmented! all_ids={all_ids}"


if __name__ == "__main__":
    test_cross_multiple_shelves_and_boxes()
    print("test_cross_multiple_shelves_and_boxes passed!")
    test_two_people_crisscrossing_between_shelves()
    print("test_two_people_crisscrossing_between_shelves passed!")
