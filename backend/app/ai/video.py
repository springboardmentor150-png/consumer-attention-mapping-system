from __future__ import annotations

import cv2

from .tracker import PersonTracker


def run_person_tracking(source: str = "0", display: bool = True):
    tracker = PersonTracker()

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
        cap.release()
        if display:
            cv2.destroyAllWindows()

