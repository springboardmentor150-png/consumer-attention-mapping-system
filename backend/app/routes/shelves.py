from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.shelf import Shelf
from app.schemas.shelf import ShelfCreate, ShelfResponse

router = APIRouter(prefix="/shelves", tags=["Shelves"])

@router.post("/", response_model=ShelfResponse, status_code=status.HTTP_201_CREATED)
def create_shelf(shelf: ShelfCreate, db: Session = Depends(get_db)):
    db_shelf = Shelf(
        shelf_name=shelf.shelf_name,
        category=shelf.category,
        store_id=shelf.store_id,
    )
    db.add(db_shelf)
    db.commit()
    db.refresh(db_shelf)
    return db_shelf

@router.get("/", response_model=list[ShelfResponse])
def get_shelves(db: Session = Depends(get_db)):
    return db.query(Shelf).all()

@router.put("/{shelf_id}", response_model=ShelfResponse)
def update_shelf(shelf_id: int, updated: ShelfCreate, db: Session = Depends(get_db)):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf Not Found")
    shelf.shelf_name = updated.shelf_name
    shelf.category = updated.category
    shelf.store_id = updated.store_id
    db.commit()
    db.refresh(shelf)
    return shelf

@router.delete("/{shelf_id}")
def delete_shelf(shelf_id: int, db: Session = Depends(get_db)):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if not shelf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf Not Found")
    db.delete(shelf)
    db.commit()
    return {"message": "Shelf Deleted Successfully"}
