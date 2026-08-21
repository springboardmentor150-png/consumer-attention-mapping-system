"""
tracking_service.py

Handles all database operations for shopper tracking.
"""

from sqlalchemy.orm import Session

from app.models.shopper_tracking import ShopperTracking
from app.schemas.shopper_tracking import ShopperTrackingCreate


class TrackingService:

    def save_tracking(
        self,
        db: Session,
        tracking: ShopperTrackingCreate
    ):
        """
        Save a shopper tracking record.
        """

        record = ShopperTracking(
            track_id=tracking.track_id,

            x1=tracking.x1,
            y1=tracking.y1,

            x2=tracking.x2,
            y2=tracking.y2,

            confidence=tracking.confidence,

            frame_number=tracking.frame_number,

            shelf_name=tracking.shelf_name
        )

        db.add(record)
        db.commit()
        db.refresh(record)

        return record

    def get_all_tracking(
        self,
        db: Session
    ):
        """
        Get all tracking records.
        """

        return db.query(ShopperTracking).all()

    def get_tracking_by_track_id(
        self,
        db: Session,
        track_id: int
    ):
        """
        Get all records for one shopper.
        """

        return (
            db.query(ShopperTracking)
            .filter(
                ShopperTracking.track_id == track_id
            )
            .all()
        )

    def delete_tracking(
        self,
        db: Session,
        track_id: int
    ):
        """
        Delete all records of one shopper.
        """

        records = (
            db.query(ShopperTracking)
            .filter(
                ShopperTracking.track_id == track_id
            )
            .all()
        )

        if not records:
            return False

        for record in records:
            db.delete(record)

        db.commit()

        return True


# Singleton instance
tracking_service = TrackingService()