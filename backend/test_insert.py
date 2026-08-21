from database import SessionLocal
from models import ConsumerTracking
from datetime import datetime

db = SessionLocal()

tracking = ConsumerTracking(
    tracker_id=999,
    store_id=1,
    shelf_id=1,
    entry_time=datetime.now(),
    exit_time=datetime.now(),
    dwell_time=12.5
)

db.add(tracking)
db.commit()
db.close()

print("Record inserted successfully!")