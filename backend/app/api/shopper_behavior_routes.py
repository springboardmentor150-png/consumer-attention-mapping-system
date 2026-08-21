from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal

from app.services.shopper_behavior_service import shopper_behavior_service

from app.schemas.shopper_behavior import ShopperBehaviorCreate

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def save_behavior(
    behavior: ShopperBehaviorCreate,
    db: Session = Depends(get_db)
):
    return shopper_behavior_service.save_behavior(db, behavior)


@router.get("/")
def get_behavior(db: Session = Depends(get_db)):
    return shopper_behavior_service.get_all_behavior(db)