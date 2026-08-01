from __future__ import annotations

import time
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np


# Lightweight timer API for callers that only need the elapsed time per
# tracker ID.  ``DwellTracker`` below uses richer session metadata for the
# database-backed tracking flow.
entry_times: Dict[int, float] = {}


def start_timer(shopper_id: int) -> None:
    """Start a timer for a shopper, without resetting an active visit."""
    if shopper_id not in entry_times:
        entry_times[shopper_id] = time.time()


def stop_timer(shopper_id: int) -> float:
    """Stop a shopper's timer and return its duration in seconds."""
    if shopper_id in entry_times:
        duration = time.time() - entry_times[shopper_id]
        del entry_times[shopper_id]
        return duration
    return 0


class DwellTracker:
    def __init__(self, zone: List[int], shelf_id: int, store_id: int, session_factory=None) -> None:
        self.zone = zone
        self.shelf_id = shelf_id
        self.store_id = store_id
        self.session_factory = session_factory
        self.active_sessions: Dict[int, Dict[str, Any]] = {}
        self.completed_sessions: List[Dict[str, Any]] = []
        self.current_time_factory = datetime.now

    def _in_zone(self, bbox: Tuple[float, float, float, float]) -> bool:
        x1, y1, x2, y2 = bbox
        center_x = (x1 + x2) / 2.0
        center_y = (y1 + y2) / 2.0
        zx1, zy1, zx2, zy2 = self.zone
        return zx1 <= center_x <= zx2 and zy1 <= center_y <= zy2

    def _close_session(self, tracker_id: int, exit_time: datetime) -> None:
        session = self.active_sessions.pop(tracker_id, None)
        if session is None:
            return

        duration = (exit_time - session["entry_time"]).total_seconds()
        record = {
            "shopper_id": session["shopper_id"],
            "shelf_id": self.shelf_id,
            "store_id": self.store_id,
            "entry_time": session["entry_time"],
            "exit_time": exit_time,
            "duration": round(max(0.0, duration), 2),
        }
        self.completed_sessions.append(record)

        print(
            f"Shopper ID : {record['shopper_id']}\n"
            f"Shelf : Shelf A\n"
            f"Duration : {record['duration']:.1f} seconds"
        )

        # A visit must be available to analytics as soon as the shopper leaves,
        # rather than only when the video-capture process exits.
        if self.session_factory is not None:
            self.save_completed_sessions()

    def update(self, frame: Optional[np.ndarray], detections: Any) -> None:
        current_time = self.current_time_factory()
        tracker_ids = [int(tracker_id) for tracker_id in detections.tracker_id]
        bboxes = list(detections.xyxy)

        current_ids = set(tracker_ids)
        previous_ids = set(self.active_sessions.keys())

        for tracker_id in list(previous_ids - current_ids):
            self._close_session(tracker_id, current_time)

        for tracker_id in list(previous_ids & current_ids):
            bbox_index = tracker_ids.index(tracker_id)
            bbox = tuple(bboxes[bbox_index])
            if not self._in_zone(bbox):
                self._close_session(tracker_id, current_time)

        for tracker_id, bbox in zip(tracker_ids, bboxes):
            if tracker_id in self.active_sessions:
                continue

            if self._in_zone(tuple(bbox)):
                self.active_sessions[tracker_id] = {
                    "entry_time": current_time,
                    "shopper_id": int(tracker_id),
                }

    def annotate_frame(self, frame: Optional[np.ndarray], detections: Any) -> Optional[np.ndarray]:
        if frame is None:
            return None

        zx1, zy1, zx2, zy2 = self.zone
        cv2.rectangle(frame, (zx1, zy1), (zx2, zy2), (0, 255, 0), 2)
        cv2.putText(frame, "Shelf Zone", (zx1, max(0, zy1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        return frame

    def save_completed_sessions(self) -> List[Dict[str, Any]]:
        if self.session_factory is None:
            return self.completed_sessions

        from app.models.dwell import DwellTime

        saved_items = list(self.completed_sessions)
        if not saved_items:
            return saved_items

        session = self.session_factory()
        try:
            for item in saved_items:
                session.add(DwellTime(**item))
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

        self.completed_sessions.clear()
        return saved_items
