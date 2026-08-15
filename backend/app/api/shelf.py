from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import engine
from app.core.security import get_current_user
from app.models.shelf import Shelf

router = APIRouter(
    prefix="/api/stores",
    tags=["Shelves"]
)


@router.get("/{store_id}/shelves")
def get_shelves(
    store_id: int,
    current_user: str = Depends(get_current_user)
):
    with Session(engine) as session:
        shelves = session.exec(
            select(Shelf).where(Shelf.store_id == store_id)
        ).all()

        return shelves


@router.post("/{store_id}/shelves")
def create_shelf(
    store_id: int,
    shelf_name: str,
    zone_coordinates: str,
    current_user: str = Depends(get_current_user)
):
    with Session(engine) as session:

        shelf = Shelf(
            store_id=store_id,
            shelf_name=shelf_name,
            zone_coordinates=zone_coordinates
        )

        session.add(shelf)
        session.commit()
        session.refresh(shelf)

        return shelf