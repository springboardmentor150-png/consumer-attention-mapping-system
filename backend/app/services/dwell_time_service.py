"""
dwell_time_service.py

Handles all database operations related to shopper dwell time.
"""

from sqlalchemy.orm import Session

from app.models.shopper_dwell_time import ShopperDwellTime
from app.schemas.shopper_dwell_time import ShopperDwellTimeCreate


class DwellTimeService:

    def save_dwell_time(
        self,
        db: Session,
        dwell: ShopperDwellTimeCreate
    ):
        """
        Save a dwell time record.
        """

        record = ShopperDwellTime(
            track_id=dwell.track_id,
            entry_time=dwell.entry_time,
            exit_time=dwell.exit_time,
            dwell_time_seconds=dwell.dwell_time_seconds
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return record

    def get_all_dwell_times(
        self,
        db: Session
    ):
        """
        Return all dwell time records.
        """

        return db.query(ShopperDwellTime).all()

    def get_dwell_time_by_track_id(
        self,
        db: Session,
        track_id: int
    ):
        """
        Return all dwell time records
        for a specific shopper.
        """

        return (
            db.query(ShopperDwellTime)
            .filter(
                ShopperDwellTime.track_id == track_id
            )
            .all()
        )

    def delete_dwell_time(
        self,
        db: Session,
        track_id: int
    ):
        """
        Delete all dwell time records
        for a specific shopper.
        """

        records = (
            db.query(ShopperDwellTime)
            .filter(
                ShopperDwellTime.track_id == track_id
            )
            .all()
        )

        if not records:
            return False

        for record in records:
            db.delete(record)

        db.commit()

        return True


# Singleton Instance
dwell_time_service = DwellTimeService()