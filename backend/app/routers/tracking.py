from typing import Any, Dict, List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.dwell import DwellTime
from app.schemas.dwell import DwellResponse

router = APIRouter(prefix="/tracking", tags=["Tracking"])


@router.get("/status")
def status():
    return {"message": "Tracking Engine Running"}


@router.get("/dwell", response_model=List[DwellResponse])
def list_dwell_records(db: Session = Depends(get_db)) -> List[Dict[str, Any]]:
    records = db.query(DwellTime).all()
    return records
