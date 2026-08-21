from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.customer_path import CustomerPath

router = APIRouter()


@router.get("/{person_id}")
def replay(person_id: int, db: Session = Depends(get_db)):
    data = (
        db.query(CustomerPath)
        .filter(CustomerPath.person_id == person_id)
        .order_by(CustomerPath.frame_no)
        .all()
    )
    return [
        {
            "x": p.x,
            "y": p.y,
            "frame": p.frame_no,
            "time": p.timestamp,
        }
        for p in data
    ]
