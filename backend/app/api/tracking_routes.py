"""
tracking_routes.py

Tracking API endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.shopper_tracking import ShopperTrackingCreate
from app.services.tracking_service import tracking_service


router = APIRouter()


# ----------------------------
# Database Dependency
# ----------------------------

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ----------------------------
# Save Tracking
# ----------------------------

@router.post("/")
def create_tracking(
    tracking: ShopperTrackingCreate,
    db: Session = Depends(get_db)
):

    saved = tracking_service.save_tracking(
        db,
        tracking
    )

    return {
        "message": "Tracking saved successfully",
        "data": saved
    }


# ----------------------------
# Get All Tracking
# ----------------------------

@router.get("/")
def get_all_tracking(
    db: Session = Depends(get_db)
):

    data = tracking_service.get_all_tracking(db)

    return {
        "count": len(data),
        "data": data
    }


# ----------------------------
# Get Tracking by Track ID
# ----------------------------

@router.get("/{track_id}")
def get_tracking(
    track_id: int,
    db: Session = Depends(get_db)
):

    data = tracking_service.get_tracking_by_track_id(
        db,
        track_id
    )

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Track ID not found"
        )

    return data


# ----------------------------
# Delete Tracking
# ----------------------------

@router.delete("/{track_id}")
def delete_tracking(
    track_id: int,
    db: Session = Depends(get_db)
):

    deleted = tracking_service.delete_tracking(
        db,
        track_id
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Track ID not found"
        )

    return {
        "message": "Tracking deleted successfully"
    }