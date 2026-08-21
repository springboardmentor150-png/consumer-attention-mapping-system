from __future__ import annotations

import sys
from pathlib import Path

import cv2
import supervision as sv
from ultralytics import YOLO

# Allow both ``python -m app.ai.tracker`` and the tutorial command
# ``python app/ai/tracker.py`` when run from the backend directory.
if __package__ in (None, ""):
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
    from app.ai.dwell_time import DwellTracker
    from app.ai.zones import ZONE
else:
    from .dwell_time import DwellTracker
    from .zones import ZONE

from app.database.database import SessionLocal


def _try_import_gaze_helpers():
    try:
        if __package__ in (None, ""):
            from app.ai.gaze import detect_face, direction_to_shelf, estimate_head_direction
        else:
            from .gaze import detect_face, direction_to_shelf, estimate_head_direction
    except ImportError:
        return None, None, None
    return detect_face, direction_to_shelf, estimate_head_direction


class PersonTracker:
    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        dwell_tracker: DwellTracker | None = None,
        attention_session_factory=SessionLocal,
    ) -> None:
        self.model = YOLO(model_path)
        self.tracker = sv.ByteTrack(
            track_activation_threshold=0.25,
            lost_track_buffer=30,
            minimum_matching_threshold=0.8,
            frame_rate=30,
        )
        self.box_annotator = sv.BoxAnnotator()
        self.label_annotator = sv.LabelAnnotator()
        self.dwell_tracker = dwell_tracker or DwellTracker(zone=ZONE["Shelf A"], shelf_id=1, store_id=1, session_factory=None)
        self.attention_session_factory = attention_session_factory
        self.head_directions: dict[int, str] = {}
        self.viewed_shelves: dict[int, str] = {}

    def _detect_head_directions(self, frame, detections) -> None:
        """Estimate face orientation separately for each tracked shopper."""
        detect_face, direction_to_shelf, estimate_head_direction = _try_import_gaze_helpers()
        if detect_face is None:
            return

        frame_height, frame_width = frame.shape[:2]
        current_ids = set()

        for tracker_id, bbox in zip(detections.tracker_id, detections.xyxy):
            tracker_id = int(tracker_id)
            x1, y1, x2, y2 = (int(value) for value in bbox)
            x1, x2 = max(0, x1), min(frame_width, x2)
            y1, y2 = max(0, y1), min(frame_height, y2)
            face = frame[y1:y2, x1:x2]
            direction = estimate_head_direction(detect_face(face))

            current_ids.add(tracker_id)
            if direction is not None:
                self.head_directions[tracker_id] = direction
                shelf = direction_to_shelf(direction)
                if self.viewed_shelves.get(tracker_id) != shelf:
                    self.viewed_shelves[tracker_id] = shelf
                    self._save_attention(tracker_id, shelf, confidence=0.92)
                    print(f"ID {tracker_id}\nLooking At {shelf}")
            else:
                self.head_directions.pop(tracker_id, None)

        for tracker_id in set(self.head_directions) - current_ids:
            self.head_directions.pop(tracker_id, None)

        for tracker_id in set(self.viewed_shelves) - current_ids:
            self.viewed_shelves.pop(tracker_id, None)

    def _save_attention(self, shopper_id: int, shelf: str, confidence: float) -> None:
        """Persist a changed attention event, if database persistence is enabled."""
        if self.attention_session_factory is None:
            return

        from app.models.attention import Attention

        db = self.attention_session_factory()
        try:
            db.add(Attention(shopper_id=shopper_id, shelf=shelf, confidence=confidence))
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def track_frame(self, frame):
        result = self.model(frame, classes=[0], stream=False, conf=0.5)[0]
        detections = sv.Detections.from_ultralytics(result)
        detections = self.tracker.update_with_detections(detections)

        if self.dwell_tracker is not None:
            self.dwell_tracker.update(frame, detections)

        self._detect_head_directions(frame, detections)

        labels = []
        for tracker_id in detections.tracker_id:
            tracker_id = int(tracker_id)
            label = f"ID {tracker_id}"
            if self.dwell_tracker is not None:
                session = self.dwell_tracker.active_sessions.get(tracker_id)
                if session is not None:
                    seconds = int((self.dwell_tracker.current_time_factory() - session["entry_time"]).total_seconds())
                    label += f" {seconds}s"
            if direction := self.head_directions.get(tracker_id):
                label += f" | {self.viewed_shelves[tracker_id]}"
            labels.append(label)

        annotated_frame = self.box_annotator.annotate(frame, detections)
        annotated_frame = self.label_annotator.annotate(annotated_frame, detections, labels)

        if self.dwell_tracker is not None:
            annotated_frame = self.dwell_tracker.annotate_frame(annotated_frame, detections)

        return annotated_frame, detections

    def update(self, detections):
        return self.tracker.update_with_detections(detections)

        if self.dwell_tracker is not None:
            annotated_frame = self.dwell_tracker.annotate_frame(annotated_frame, detections)

        return annotated_frame, detections


def run_tracker(source: str = "0"):
    # Make direct execution create both tracking tables, just as the FastAPI
    # application does at startup.
    from app.database.database import Base, engine
    from app.models import attention, dwell

    Base.metadata.create_all(bind=engine)
    dwell_tracker = DwellTracker(zone=ZONE["Shelf A"], shelf_id=1, store_id=1, session_factory=SessionLocal)
    tracker = PersonTracker(dwell_tracker=dwell_tracker)
    cap = cv2.VideoCapture(source)

    if not cap.isOpened():
        raise RuntimeError(f"Unable to open source: {source}")

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            annotated_frame, _ = tracker.track_frame(frame)
            cv2.imshow("Tracking", annotated_frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    finally:
        dwell_tracker.save_completed_sessions()
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    run_tracker()
