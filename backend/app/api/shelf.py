from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import require_role, get_current_user

from app.models.shelf import Shelf
from app.schemas.shelf import ShelfCreate

router = APIRouter()


@router.post("/shelves")
def create_shelf(
    shelf: ShelfCreate,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Store Manager"])
    )
):

    new_shelf = Shelf(
        zone_name=shelf.zone_name,
        store_id=shelf.store_id,
        zone_coordinates=shelf.zone_coordinates
    )

    db.add(new_shelf)
    db.commit()
    db.refresh(new_shelf)

    return {
        "message": "Shelf added successfully!",
        "shelf": new_shelf
    }


@router.get("/shelves")
def get_shelves(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    return db.query(Shelf).all()


@router.delete("/shelves/{shelf_id}")
def delete_shelf(
    shelf_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        require_role(["Admin", "Store Manager"])
    )
):

    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id
    ).first()

    if not shelf:
        raise HTTPException(
            status_code=404,
            detail="Shelf not found"
        )

    db.delete(shelf)
    db.commit()

    return {
        "message": "Shelf deleted successfully!"
    }