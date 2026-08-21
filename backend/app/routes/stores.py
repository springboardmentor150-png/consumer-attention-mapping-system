from fastapi import APIRouter, Depends, HTTPException, status
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


@router.delete('/stores/{store_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if store is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store not found")

    db.delete(store)
    db.commit()
