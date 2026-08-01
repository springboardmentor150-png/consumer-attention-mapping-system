from datetime import datetime, timedelta

from app.ai.dwell_time import DwellTracker
from app.ai.zones import ZONE


class FakeDetections:
    def __init__(self, tracker_id, xyxy):
        self.tracker_id = tracker_id
        self.xyxy = xyxy


def test_dwell_tracker_records_entry_and_exit():
    tracker = DwellTracker(zone=ZONE["Shelf A"], shelf_id=1, store_id=1, session_factory=None)
    base_time = datetime(2024, 1, 1, 12, 0, 0)
    tracker.current_time_factory = lambda: base_time

    tracker.update(frame=None, detections=FakeDetections([7], [[200, 150, 300, 250]]))

    tracker.current_time_factory = lambda: base_time + timedelta(seconds=5)
    tracker.update(frame=None, detections=FakeDetections([7], [[500, 500, 600, 600]]))

    assert len(tracker.completed_sessions) == 1
    record = tracker.completed_sessions[0]
    assert record["shopper_id"] == 7
    assert record["shelf_id"] == 1
    assert record["store_id"] == 1
    assert record["duration"] == 5.0
