from __future__ import annotations

import cv2

from app.database.database import SessionLocal

from .dwell_time import DwellTracker
from .tracker import PersonTracker
from .zones import ZONE


def run_person_tracking(source: str = "0", display: bool = True):
    dwell_tracker = DwellTracker(zone=ZONE["Shelf A"], shelf_id=1, store_id=1, session_factory=SessionLocal)
    tracker = PersonTracker(dwell_tracker=dwell_tracker)

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        raise RuntimeError(f"Unable to open source: {source}")

    try:
        while True:
            success, frame = cap.read()
            if not success:
                break

            annotated_frame, _ = tracker.track_frame(frame)

            if display:
                cv2.imshow("Consumer Attention - Person Tracking", annotated_frame)
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
    finally:
        dwell_tracker.save_completed_sessions()
        cap.release()
        if display:
            cv2.destroyAllWindows()

