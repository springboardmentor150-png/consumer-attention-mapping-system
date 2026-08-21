from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.services.notification_service import notification_service


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


@router.get("/")
def get_notifications(
    db: Session = Depends(get_db)
):

    return notification_service.get_alerts(
        db
    )