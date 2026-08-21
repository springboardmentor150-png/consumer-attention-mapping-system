import numpy as np
import sys
sys.path.insert(0, '.')
from app.ml.tracking.bytetrack_tracker import ByteTracker, extract_appearance_feature, appearance_similarity

def test_shelf_occlusion_and_aspect_ratio_change():
    """
    Test person walking in open aisle (full body), then passing behind a shelf
    (lower body occluded, bounding box height cut in half), then emerging full body again.
    """
    tracker = ByteTracker()
    tracker.reset()

    h, w = 720, 1280

    for frame_idx in range(1, 60):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        # Person moves horizontally across the aisle
        px = 0.10 + (frame_idx * 0.012)

        if 20 <= frame_idx <= 40:
            # Behind shelf: lower body cut off from y=0.45 down to 0.65
            # Bounding box is only upper body (y1=0.25, y2=0.45)
            y1, y2 = 0.25, 0.45
            # Draw upper body (red shirt)
            bx1, by1, bx2, by2 = int(px*w), int(y1*h), int((px+0.08)*w), int(y2*h)
            frame[by1:by2, bx1:bx2] = (0, 0, 200)
            conf = 0.78
        else:
            # Full body: y1=0.25, y2=0.65
            y1, y2 = 0.25, 0.65
            bx1, by1, bx2, by2 = int(px*w), int(y1*h), int((px+0.08)*w), int(y2*h)
            frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (0, 0, 200)   # Red shirt
            frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (200, 0, 0)   # Blue jeans
            conf = 0.92

        bbox = (px, y1, px + 0.08, y2)
        detections = [{
            "bbox": bbox,
            "center_x": (bbox[0] + bbox[2]) / 2,
            "center_y": (bbox[1] + bbox[3]) / 2,
            "conf": conf
        }]

        tracked = tracker.update(detections, frame_idx, frame_idx / 25.0, (h, w), frame=frame)
        all_ids = tracker.get_all_track_ids()
        active_ids = [t.track_id for t in tracked]

        assert len(all_ids) == 1, f"Frame {frame_idx}: Shelf occlusion caused ID fragmentation! Minted: {all_ids}"
        assert active_ids == [1], f"Frame {frame_idx}: Expected active track [1], got {active_ids}"

def test_shelf_turnaround_viewpoint_change():
    """
    Test person walking towards shelf (front view), turning to face shelf (back view)
    for 20 frames, then turning around and walking away.
    """
    tracker = ByteTracker()
    tracker.reset()

    h, w = 720, 1280

    for frame_idx in range(1, 60):
        frame = np.zeros((h, w, 3), dtype=np.uint8)
        px = 0.20 + (frame_idx * 0.005)
        py = 0.30
        bbox = (px, py, px + 0.08, py + 0.35)
        bx1, by1, bx2, by2 = int(bbox[0]*w), int(bbox[1]*h), int(bbox[2]*w), int(bbox[3]*h)

        if 20 <= frame_idx <= 40:
            # Facing shelf (back view: dark jacket, dark pants)
            frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (50, 50, 50)
            frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (40, 40, 40)
            conf = 0.75
        else:
            # Front view (bright orange shirt, blue pants)
            frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (0, 165, 255)
            frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (220, 0, 0)
            conf = 0.90

        detections = [{
            "bbox": bbox,
            "center_x": (bbox[0] + bbox[2]) / 2,
            "center_y": (bbox[1] + bbox[3]) / 2,
            "conf": conf
        }]

        tracked = tracker.update(detections, frame_idx, frame_idx / 25.0, (h, w), frame=frame)
        all_ids = tracker.get_all_track_ids()
        assert len(all_ids) == 1, f"Frame {frame_idx}: Turning to shelf caused new ID: {all_ids}"

if __name__ == "__main__":
    test_shelf_occlusion_and_aspect_ratio_change()
    print("test_shelf_occlusion passed!")
    test_shelf_turnaround_viewpoint_change()
    print("test_shelf_turnaround passed!")
