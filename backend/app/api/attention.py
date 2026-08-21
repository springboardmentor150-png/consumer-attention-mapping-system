from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.attention_event import AttentionEvent

router = APIRouter(tags=["Attention"])


@router.get("/top-shelves")
def top(db: Session = Depends(get_db)):
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
            "avg_attention": round(r[1] or 0, 2),
            "views": r[2],
        }
        for r in result
    ]
