from database import SessionLocal
from models import ConsumerTracking
from datetime import datetime


def create_tracking_session(tracker_id, store_id=1, shelf_id=1):
    db = SessionLocal()

    tracking = ConsumerTracking(
    tracker_id=tracker_id,
    store_id=store_id,
    shelf_id=shelf_id,
    entry_time=datetime.now(),
    dwell_time=0
)
    db.add(tracking)
    db.commit()
    db.refresh(tracking)

    tracking_db_id = tracking.id

    db.close()

    return tracking_db_id


def update_tracking_session(
    record_id,
    dwell_time,
    behavior_segment
):
    db = SessionLocal()

    tracking = db.query(ConsumerTracking).filter(
        ConsumerTracking.id == record_id
    ).first()

    if tracking:
        tracking.dwell_time = dwell_time
        tracking.exit_time = datetime.now()

        # NEW
        tracking.behavior_segment = behavior_segment

        db.commit()

    db.close()