from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.store import Store
from app.models.shelf import Shelf
from app.schemas.store_schema import StoreCreate
from app.schemas.shelf_schema import ShelfCreate

router = APIRouter(prefix="/api/stores", tags=["Stores"])

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ------------------------
# GET /api/stores
# ------------------------
@router.get("/")
def get_stores(db: Session = Depends(get_db)):
    return db.query(Store).all()

# ------------------------
# POST /api/stores
# ------------------------
@router.post("/")
def create_store(store: StoreCreate, db: Session = Depends(get_db)):
    new_store = Store(
        name=store.name,
        location=store.location
    )

    db.add(new_store)
    db.commit()
    db.refresh(new_store)

    return new_store

# ------------------------
# GET /api/stores/{storeId}/shelves
# ------------------------
@router.get("/{storeId}/shelves")
def get_shelves(storeId: int, db: Session = Depends(get_db)):
    return db.query(Shelf).filter(Shelf.store_id == storeId).all()

# ------------------------
# POST /api/stores/{storeId}/shelves
# ------------------------
@router.post("/{storeId}/shelves")
def create_shelf(
    storeId: int,
    shelf: ShelfCreate,
    db: Session = Depends(get_db)
):
    store = db.query(Store).filter(Store.id == storeId).first()

    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    new_shelf = Shelf(
        name=shelf.name,
        category=shelf.category,
         x1=shelf.x1,

        y1=shelf.y1,

        x2=shelf.x2,

        y2=shelf.y2,
        store_id=storeId
    )

    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)

    return new_shelf