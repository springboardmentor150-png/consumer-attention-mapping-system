from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.attention_event import AttentionEvent

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    total_people = db.query(func.count(AttentionEvent.person_id)).scalar()
    avg_attention = db.query(func.avg(AttentionEvent.attention_score)).scalar()

    shelves = (
        db.query(
            AttentionEvent.shelf_id,
            func.avg(AttentionEvent.attention_score),
            func.avg(AttentionEvent.dwell_time),
        )
        .group_by(AttentionEvent.shelf_id)
        .all()
    )

    return {
        "total_people": total_people or 0,
        "average_attention": round(float(avg_attention or 0), 2),
        "shelves": [
            {
                "shelf": s[0],
                "attention": round(float(s[1] or 0), 2),
                "dwell": round(float(s[2] or 0), 2),
            }
            for s in shelves
        ],
    }


@router.get("/top-shelf")
def top_shelf(db: Session = Depends(get_db)):
    shelf = (
        db.query(
            AttentionEvent.shelf_id,
            func.avg(AttentionEvent.attention_score).label("score"),
        )
        .group_by(AttentionEvent.shelf_id)
        .order_by(func.avg(AttentionEvent.attention_score).desc())
        .first()
    )

    if shelf is None:
        return {"top_shelf": None, "score": 0}

    return {"top_shelf": shelf[0], "score": round(float(shelf[1] or 0), 2)}


@router.get("/ranking")
def ranking(db: Session = Depends(get_db)):
    result = (
        db.query(
            AttentionEvent.shelf_id,
            func.avg(AttentionEvent.attention_score),
            func.count(AttentionEvent.id),
        )
        .group_by(AttentionEvent.shelf_id)
        .all()
    )

    return [
        {
            "shelf": r[0],
            "attention": round(float(r[1] or 0), 2),
            "views": r[2],
        }
        for r in result
    ]


@router.get("/history")
def history():
    return {
        "labels": ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"],
        "values": [72, 81, 79, 88, 91, 87],
    }
