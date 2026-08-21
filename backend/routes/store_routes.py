from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Store, Shelf
from schemas import StoreCreate, ShelfCreate

router = APIRouter(tags=["Store Management"])


# -----------------------------
# Store APIs
# -----------------------------

@router.post("/stores")
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    new_store = Store(
        store_name=store.store_name,
        location=store.location
    )

    db.add(new_store)
    db.commit()
    db.refresh(new_store)

    return {
        "message": "Store Added Successfully",
        "store": new_store
    }


@router.get("/stores")
def get_stores(db: Session = Depends(get_db)):
    return db.query(Store).all()


# -----------------------------
# Shelf APIs
# -----------------------------

@router.post("/shelves")
def create_shelf(shelf: ShelfCreate, db: Session = Depends(get_db)):
    new_shelf = Shelf(
        store_id=shelf.store_id,
        zone_name=shelf.zone_name
    )

    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)

    return {
        "message": "Shelf Added Successfully",
        "shelf": new_shelf
    }


@router.get("/shelves")
def get_shelves(db: Session = Depends(get_db)):
    return db.query(Shelf).all()