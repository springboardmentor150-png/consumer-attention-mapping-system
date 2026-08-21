from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.shopper_session import ShopperSession
from app.schemas.shopper_session import ShopperSessionCreate, ShopperSessionResponse
from app.ai.segmentation import classify_shopper

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


@router.post(
    "/segments",
    response_model=ShopperSessionResponse
)
def create_shopper_session(
    session: ShopperSessionCreate,
    db: Session = Depends(get_db)
):
    segment = classify_shopper(
        path_length=session.path_length,
        total_dwell_time=session.total_dwell_time,
        shelf_dwell_time=session.shelf_dwell_time,
        gaze_shifts=session.gaze_shifts
    )

    db_session = ShopperSession(
        shopper_id=session.shopper_id,
        path_length=session.path_length,
        total_dwell_time=session.total_dwell_time,
        shelf_dwell_time=session.shelf_dwell_time,
        gaze_shifts=session.gaze_shifts,
        segment=segment
    )

    db.add(db_session)
    db.commit()
    db.refresh(db_session)

    return db_session


@router.get(
    "/segments",
    response_model=list[ShopperSessionResponse]
)
def get_shopper_segments(
    db: Session = Depends(get_db)
):
    return db.query(ShopperSession).all()
