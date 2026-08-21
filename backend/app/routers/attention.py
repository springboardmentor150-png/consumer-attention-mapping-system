from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.attention import Attention
from app.schemas.attention import AttentionResponse


router = APIRouter(prefix="/attention", tags=["Attention"])


@router.get("", response_model=list[AttentionResponse])
def get_attention(db: Session = Depends(get_db)):
    return db.query(Attention).all()
