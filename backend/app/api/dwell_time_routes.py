"""
dwell_time_routes.py

FastAPI routes for Shopper Dwell Time.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.schemas.shopper_dwell_time import (
    ShopperDwellTimeCreate,
    ShopperDwellTimeResponse
)
from app.services.dwell_time_service import dwell_time_service


router = APIRouter()


# ---------------------------------------
# Database Dependency
# ---------------------------------------

def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ---------------------------------------
# Save Dwell Time
# ---------------------------------------

@router.post(
    "/",
    response_model=ShopperDwellTimeResponse
)
def create_dwell_time(
    dwell: ShopperDwellTimeCreate,
    db: Session = Depends(get_db)
):

    return dwell_time_service.save_dwell_time(
        db,
        dwell
    )


# ---------------------------------------
# Get All Dwell Times
# ---------------------------------------

@router.get(
    "/",
    response_model=list[ShopperDwellTimeResponse]
)
def get_all_dwell_times(
    db: Session = Depends(get_db)
):

    return dwell_time_service.get_all_dwell_times(
        db
    )


# ---------------------------------------
# Get Dwell Time by Track ID
# ---------------------------------------

@router.get(
    "/{track_id}",
    response_model=list[ShopperDwellTimeResponse]
)
def get_dwell_time(
    track_id: int,
    db: Session = Depends(get_db)
):

    data = dwell_time_service.get_dwell_time_by_track_id(
        db,
        track_id
    )

    if not data:

        raise HTTPException(
            status_code=404,
            detail="Track ID not found"
        )

    return data


# ---------------------------------------
# Delete Dwell Time
# ---------------------------------------

@router.delete("/{track_id}")
def delete_dwell_time(
    track_id: int,
    db: Session = Depends(get_db)
):

    deleted = dwell_time_service.delete_dwell_time(
        db,
        track_id
    )

    if not deleted:

        raise HTTPException(
            status_code=404,
            detail="Track ID not found"
        )

    return {
        "message": "Dwell Time Deleted Successfully"
    }