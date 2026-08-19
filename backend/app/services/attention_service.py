from datetime import datetime

from app.models.attention_event import AttentionEvent


class AttentionService:

    def __init__(self, db):
        self.db = db

    def save(self, person, store, shelf, dwell, score, direction, yaw, pitch):
        event = AttentionEvent(
            person_id=person,
            store_id=store,
            shelf_id=shelf,
            dwell_time=dwell,
            attention_score=score,
            gaze_direction=direction,
            yaw=yaw,
            pitch=pitch,
            timestamp=datetime.utcnow(),
        )
        self.db.add(event)
        self.db.commit()
