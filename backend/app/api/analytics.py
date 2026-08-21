from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud.analytics import (
    get_all_sessions,
    get_summary,
)
from app.schemas.analytics import AnalyticsResponse

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get(
    "/",
    response_model=list[AnalyticsResponse]
)
def analytics(db: Session = Depends(get_db)):

    return get_all_sessions(db)


@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):

    return get_summary(db)