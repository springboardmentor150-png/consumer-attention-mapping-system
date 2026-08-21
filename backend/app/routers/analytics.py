from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.attention import Attention
from app.models.dwell import DwellTime
from app.schemas.dwell import DwellResponse

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/dwell", response_model=list[DwellResponse])
def list_dwell_records(db: Session = Depends(get_db)):
    return db.query(DwellTime).all()


@router.get("/summary")
def analytics_summary(db: Session = Depends(get_db)):
    total_visitors = db.query(DwellTime).count()
    attention_records = db.query(Attention).count()
    average_dwell_time = db.query(func.avg(DwellTime.duration)).scalar() or 0
    most_viewed_shelf = (
        db.query(Attention.shelf, func.count(Attention.id).label("views"))
        .group_by(Attention.shelf)
        .order_by(func.count(Attention.id).desc())
        .first()
    )

    return {
        "total_visitors": total_visitors,
        "attention_records": attention_records,
        "average_dwell_time": round(float(average_dwell_time), 2),
        "most_viewed_shelf": most_viewed_shelf.shelf if most_viewed_shelf else None,
    }


@router.get("/shelves")
def shelf_attention(db: Session = Depends(get_db)):
    rows = (
        db.query(Attention.shelf, func.count(Attention.id).label("count"))
        .group_by(Attention.shelf)
        .order_by(Attention.shelf)
        .all()
    )
    counts = {row.shelf: row.count for row in rows}
    return [
        {"shelf": shelf, "count": counts.get(shelf, 0)}
        for shelf in ("Shelf A", "Shelf B", "Shelf C")
    ]
