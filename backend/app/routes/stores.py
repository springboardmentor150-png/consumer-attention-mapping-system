from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.store import Store
from app.schemas.store import StoreCreate

router = APIRouter()


@router.get('/stores')
def get_stores(db: Session = Depends(get_db)):
    return db.query(Store).all()


@router.post('/stores', status_code=status.HTTP_201_CREATED)
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    db_store = Store(name=store.name, location=store.location)
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store
