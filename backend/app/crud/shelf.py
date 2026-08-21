from sqlalchemy.orm import Session

from app.models.shelf import Shelf


def create_shelf(
    db: Session,
    store_id: int,
    shelf_name: str,
    zone_coordinates: str,
):
    shelf = Shelf(
        store_id=store_id,
        shelf_name=shelf_name,
        zone_coordinates=zone_coordinates,
    )

    db.add(shelf)
    db.commit()
    db.refresh(shelf)

    return shelf


def get_shelves_by_store(db: Session, store_id: int):
    return db.query(Shelf).filter(
        Shelf.store_id == store_id
    ).all()


def update_shelf(
    db: Session,
    shelf_id: int,
    shelf_name: str,
    zone_coordinates: str,
):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id
    ).first()

    if not shelf:
        return None

    shelf.shelf_name = shelf_name
    shelf.zone_coordinates = zone_coordinates

    db.commit()
    db.refresh(shelf)

    return shelf


def delete_shelf(db: Session, shelf_id: int):
    shelf = db.query(Shelf).filter(
        Shelf.id == shelf_id
    ).first()

    if not shelf:
        return None

    db.delete(shelf)
    db.commit()

    return {"message": "Shelf deleted successfully"}