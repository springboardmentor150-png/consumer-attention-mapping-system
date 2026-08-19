from app.models.tracking_session import TrackingSession


class TrackingService:

    def __init__(self, db):
        self.db = db

    def save_session(
        self,
        person_id,
        store_id,
        shelf_id,
        entry,
        exit,
        dwell,
    ):
        session = TrackingSession(
            person_id=person_id,
            store_id=store_id,
            shelf_id=shelf_id,
            entry_time=entry,
            exit_time=exit,
            dwell_time=dwell,
        )
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session
