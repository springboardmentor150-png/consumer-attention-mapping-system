import numpy as np
from app.ml.tracking.bytetrack_tracker import ByteTracker

def test_movement_direction_change():
    """Test person changing direction (walking right then turning left)."""
    tracker = ByteTracker()
    tracker.reset()
    fake_frame = np.full((720, 1280, 3), 120, dtype=np.uint8)

    # Frame 1 to 20: walk right (x: 0.10 -> 0.30)
    # Frame 21 to 40: turn around and walk left (x: 0.30 -> 0.10)
    for frame_idx in range(1, 41):
        timestamp = frame_idx / 25.0
        if frame_idx <= 20:
            x1 = 0.10 + (frame_idx * 0.01)
        else:
            x1 = 0.30 - ((frame_idx - 20) * 0.01)
        y1 = 0.30
        x2 = x1 + 0.10
        y2 = y1 + 0.35

        detections = [{
            "bbox": (x1, y1, x2, y2),
            "center_x": (x1 + x2) / 2.0,
            "center_y": (y1 + y2) / 2.0,
            "conf": 0.90
        }]

        tracked = tracker.update(
            detections=detections,
            frame_number=frame_idx,
            timestamp=timestamp,
            frame_shape=(720, 1280),
            frame=fake_frame
        )

        assert len(tracked) == 1, f"Frame {frame_idx}: expected 1 tracked person, got {len(tracked)}"
        assert tracked[0].track_id == 1, f"Frame {frame_idx}: Person ID switched to {tracked[0].track_id} during direction change!"

def test_temporary_occlusion():
    """Test person temporarily occluded for 10 frames then reappearing."""
    tracker = ByteTracker()
    tracker.reset()
    fake_frame = np.full((720, 1280, 3), 120, dtype=np.uint8)

    for frame_idx in range(1, 45):
        timestamp = frame_idx / 25.0
        x1 = 0.10 + (frame_idx * 0.008)
        y1 = 0.25
        x2 = x1 + 0.10
        y2 = y1 + 0.35

        # Frames 15-25: Person is occluded (0 detections)
        if 15 <= frame_idx <= 25:
            detections = []
        else:
            detections = [{
                "bbox": (x1, y1, x2, y2),
                "center_x": (x1 + x2) / 2.0,
                "center_y": (y1 + y2) / 2.0,
                "conf": 0.88
            }]

        tracked = tracker.update(
            detections=detections,
            frame_number=frame_idx,
            timestamp=timestamp,
            frame_shape=(720, 1280),
            frame=fake_frame
        )

        if frame_idx > 25:
            # Person reappeared
            matching = [t for t in tracked if t.track_id == 1]
            assert len(matching) >= 1, f"Frame {frame_idx}: Person ID 1 lost after occlusion, tracks: {[t.track_id for t in tracked]}"
            assert len(tracker.get_all_track_ids()) == 1, f"Frame {frame_idx}: Multiple person IDs created: {tracker.get_all_track_ids()}"

def test_fast_movement():
    """Test fast movement where consecutive bounding boxes have zero IoU overlap."""
    tracker = ByteTracker()
    tracker.reset()
    fake_frame = np.full((720, 1280, 3), 120, dtype=np.uint8)

    # Person moves 0.12 units per frame (box width is 0.08, so IoU is 0)
    for frame_idx in range(1, 20):
        timestamp = frame_idx / 25.0
        x1 = 0.05 + (frame_idx * 0.04)
        y1 = 0.20 + (frame_idx * 0.015)
        x2 = x1 + 0.08
        y2 = y1 + 0.30

        detections = [{
            "bbox": (x1, y1, x2, y2),
            "center_x": (x1 + x2) / 2.0,
            "center_y": (y1 + y2) / 2.0,
            "conf": 0.85
        }]

        tracked = tracker.update(
            detections=detections,
            frame_number=frame_idx,
            timestamp=timestamp,
            frame_shape=(720, 1280),
            frame=fake_frame
        )

        assert len(tracked) == 1, f"Frame {frame_idx}: expected 1 track, got {len(tracked)}"
        assert tracked[0].track_id == 1, f"Frame {frame_idx}: Person ID switched to {tracked[0].track_id} during fast motion!"

if __name__ == "__main__":
    test_movement_direction_change()
    print("test_movement_direction_change passed")
    test_temporary_occlusion()
    print("test_temporary_occlusion passed")
    test_fast_movement()
    print("test_fast_movement passed")
