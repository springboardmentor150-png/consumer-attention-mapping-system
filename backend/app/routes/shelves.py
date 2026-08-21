from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.shelf import Shelf
from app.schemas.shelf import ShelfCreate

router = APIRouter()

@router.get('/shelves')
def get_shelves(db: Session = Depends(get_db)):
    return db.query(Shelf).all()

@router.post('/shelves', status_code=status.HTTP_201_CREATED)
def create_shelf(shelf: ShelfCreate, db: Session = Depends(get_db)):
    db_shelf = Shelf(
        shelf_name=shelf.shelf_name,
        category=shelf.category,
        store_id=shelf.store_id,
        zone_coordinates=shelf.zone_coordinates
    )
    db.add(db_shelf)
    db.commit()
    db.refresh(db_shelf)
    return db_shelf

@router.delete('/shelves/{shelf_id}', status_code=status.HTTP_204_NO_CONTENT)
def delete_shelf(shelf_id: int, db: Session = Depends(get_db)):
    shelf = db.query(Shelf).filter(Shelf.id == shelf_id).first()
    if shelf is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shelf not found")
    db.delete(shelf)
    db.commit()
