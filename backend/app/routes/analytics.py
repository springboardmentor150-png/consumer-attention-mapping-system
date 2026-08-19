from collections import OrderedDict

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.attention import Attention
from app.models.dwell import DwellTime

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/attention")
def get_attention(db: Session = Depends(get_db)):
    total_customers = db.query(func.count(func.distinct(Attention.shopper_id))).scalar() or 0
    average_dwell = db.query(func.avg(DwellTime.duration)).scalar() or 0
    average_attention = db.query(func.avg(Attention.confidence)).scalar() or 0

    most_viewed_shelf_row = (
        db.query(Attention.shelf, func.count(Attention.id).label("views"))
        .group_by(Attention.shelf)
        .order_by(func.count(Attention.id).desc())
        .first()
    )

    shelf_rows = (
        db.query(Attention.shelf, func.count(Attention.id).label("views"))
        .group_by(Attention.shelf)
        .order_by(Attention.shelf)
        .all()
    )

    bar_chart = [{"shelf": row.shelf, "views": row.views} for row in shelf_rows]

    dwell_rows = db.query(DwellTime.entry_time).filter(DwellTime.entry_time != None).all()
    hour_counts = OrderedDict()
    for (entry_time,) in dwell_rows:
        if entry_time is None:
            continue
        hour_label = entry_time.strftime("%I %p").lstrip("0")
        hour_counts[hour_label] = hour_counts.get(hour_label, 0) + 1

    line_chart = [
        {"time": hour, "customers": count}
        for hour, count in hour_counts.items()
    ]

    return {
        "total_customers": int(total_customers),
        "average_dwell": round(float(average_dwell or 0), 2),
        "attention_score": round(float(average_attention or 0) * 100, 2),
        "most_viewed_shelf": most_viewed_shelf_row.shelf if most_viewed_shelf_row else None,
        "bar_chart": bar_chart,
        "line_chart": line_chart,
    }
