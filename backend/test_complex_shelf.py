import numpy as np
import sys
sys.path.insert(0, '.')
from app.ml.tracking.bytetrack_tracker import ByteTracker

def test_extended_shelf_occlusion():
    """
    Test person walking behind a 2-meter wide shelf fixture:
    - Seen in frames 1-15 entering shelf zone
    - Completely occluded for 60 frames (2.4 seconds) while walking behind shelf
    - Emerges in frames 76-120 on the other side of the shelf
    """
    tracker = ByteTracker(track_buffer=200)
    tracker.reset()
    h, w = 720, 1280

    for frame_idx in range(1, 121):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Person moves horizontally across the room (x: 0.10 -> 0.85)
        px = 0.10 + (frame_idx * 0.006)
        py = 0.35
        bbox = (px, py, px + 0.08, py + 0.35)
        bx1, by1, bx2, by2 = int(bbox[0]*w), int(bbox[1]*h), int(bbox[2]*w), int(bbox[3]*h)

        # Draw person (green jacket, black trousers)
        frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (0, 180, 0)
        frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (30, 30, 30)

        # Occluded behind high shelf in frames 16 to 75
        if 16 <= frame_idx <= 75:
            detections = []
        else:
            detections = [{
                "bbox": bbox,
                "center_x": (bbox[0] + bbox[2]) / 2,
                "center_y": (bbox[1] + bbox[3]) / 2,
                "conf": 0.88
            }]

        tracked = tracker.update(detections, frame_idx, frame_idx / 25.0, (h, w), frame=frame)
        all_ids = tracker.get_all_track_ids()

        if frame_idx >= 76:
            assert len(all_ids) == 1, f"Frame {frame_idx}: Person got new ID after emerging from behind shelf! IDs: {all_ids}"
            active_ids = [t.track_id for t in tracked]
            assert active_ids == [1], f"Frame {frame_idx}: Expected active track [1], got {active_ids}"

def test_two_shoppers_browsing_same_shelf():
    """
    Test two shoppers standing in front of the same shelf:
    - Shopper 1 browsing left side (x=0.30)
    - Shopper 2 browsing right side (x=0.40)
    - Shoppers step close to each other (x=0.34 and x=0.36)
    - Shoppers swap positions or reach past each other
    - Both must maintain their respective IDs #1 and #2 throughout!
    """
    tracker = ByteTracker()
    tracker.reset()
    h, w = 720, 1280

    for frame_idx in range(1, 80):
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # Shopper 1 (Blue): starts at 0.28, shifts right towards 0.38
        p1_x = 0.28 + min(0.10, frame_idx * 0.002)
        p1_y = 0.30
        p1_box = (p1_x, p1_y, p1_x + 0.08, p1_y + 0.35)
        bx1, by1, bx2, by2 = int(p1_box[0]*w), int(p1_box[1]*h), int(p1_box[2]*w), int(p1_box[3]*h)
        frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (220, 50, 50)   # Blue top
        frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (50, 50, 50)

        # Shopper 2 (Red): starts at 0.44, shifts left towards 0.34
        p2_x = 0.44 - min(0.10, frame_idx * 0.002)
        p2_y = 0.30
        p2_box = (p2_x, p2_y, p2_x + 0.08, p2_y + 0.35)
        bx1, by1, bx2, by2 = int(p2_box[0]*w), int(p2_box[1]*h), int(p2_box[2]*w), int(p2_box[3]*h)
        frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (50, 50, 220)   # Red top
        frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (50, 50, 50)

        detections = [
            {"bbox": p1_box, "center_x": (p1_box[0] + p1_box[2])/2, "center_y": (p1_box[1] + p1_box[3])/2, "conf": 0.90},
            {"bbox": p2_box, "center_x": (p2_box[0] + p2_box[2])/2, "center_y": (p2_box[1] + p2_box[3])/2, "conf": 0.88}
        ]

        tracked = tracker.update(detections, frame_idx, frame_idx / 25.0, (h, w), frame=frame)
        all_ids = tracker.get_all_track_ids()
        active_ids = {t.track_id for t in tracked}

        assert len(all_ids) <= 2, f"Frame {frame_idx}: IDs fragmented at shelf: {all_ids}"
        assert active_ids == {1, 2}, f"Frame {frame_idx}: Active IDs should be {{1, 2}}, got {active_ids}"

if __name__ == "__main__":
    test_extended_shelf_occlusion()
    print("test_extended_shelf_occlusion passed!")
    test_two_shoppers_browsing_same_shelf()
    print("test_two_shoppers_browsing_same_shelf passed!")
