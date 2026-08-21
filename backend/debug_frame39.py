import numpy as np
import sys
sys.path.insert(0, '.')
from app.ml.tracking.bytetrack_tracker import ByteTracker

tracker = ByteTracker()
tracker.reset()
h, w = 720, 1280

for frame_idx in range(1, 45):
    frame = np.zeros((h, w, 3), dtype=np.uint8)

    p1_x = 0.28 + min(0.10, frame_idx * 0.002)
    p1_y = 0.30
    p1_box = (p1_x, p1_y, p1_x + 0.08, p1_y + 0.35)
    bx1, by1, bx2, by2 = int(p1_box[0]*w), int(p1_box[1]*h), int(p1_box[2]*w), int(p1_box[3]*h)
    frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (220, 50, 50)
    frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (50, 50, 50)

    p2_x = 0.44 - min(0.10, frame_idx * 0.002)
    p2_y = 0.30
    p2_box = (p2_x, p2_y, p2_x + 0.08, p2_y + 0.35)
    bx1, by1, bx2, by2 = int(p2_box[0]*w), int(p2_box[1]*h), int(p2_box[2]*w), int(p2_box[3]*h)
    frame[by1:by1 + (by2-by1)//2, bx1:bx2] = (50, 50, 220)
    frame[by1 + (by2-by1)//2:by2, bx1:bx2] = (50, 50, 50)

    detections = [
        {"bbox": p1_box, "center_x": (p1_box[0] + p1_box[2])/2, "center_y": (p1_box[1] + p1_box[3])/2, "conf": 0.90},
        {"bbox": p2_box, "center_x": (p2_box[0] + p2_box[2])/2, "center_y": (p2_box[1] + p2_box[3])/2, "conf": 0.88}
    ]

    tracked = tracker.update(detections, frame_idx, frame_idx / 25.0, (h, w), frame=frame)
    all_tracks = [(t.track_id, t.time_since_update) for t in tracker._tracks]
    print(f"Frame {frame_idx}: active={[t.track_id for t in tracked]}, _tracks={all_tracks}, all_ids={tracker.get_all_track_ids()}")
