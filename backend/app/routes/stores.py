from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.store import Store
from app.schemas.store import StoreCreate, StoreResponse

router = APIRouter(prefix="/stores", tags=["Stores"])

@router.post("/", response_model=StoreResponse, status_code=status.HTTP_201_CREATED)
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    db_store = Store(
        store_name=store.store_name,
        location=store.location
    )
    db.add(db_store)
    db.commit()
    db.refresh(db_store)
    return db_store

@router.get("/", response_model=list[StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    return db.query(Store).all()

@router.get("/{store_id}", response_model=StoreResponse)
def get_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store Not Found")
    return store

@router.put("/{store_id}", response_model=StoreResponse)
def update_store(store_id: int, updated: StoreCreate, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store Not Found")
    store.store_name = updated.store_name
    store.location = updated.location
    db.commit()
    db.refresh(store)
    return store

@router.delete("/{store_id}")
def delete_store(store_id: int, db: Session = Depends(get_db)):
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Store Not Found")
    db.delete(store)
    db.commit()
    return {"message": "Store Deleted Successfully"}
