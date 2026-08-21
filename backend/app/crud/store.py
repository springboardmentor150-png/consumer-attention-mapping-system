from sqlalchemy.orm import Session

from app.models.store import Store
from app.models.shelf import Shelf


def create_store(db: Session, name: str, location: str):
    store = Store(
        name=name,
        location=location,
    )

    db.add(store)
    db.commit()
    db.refresh(store)

    return store


def get_stores(db: Session):
    return db.query(Store).all()


def update_store(db: Session, store_id: int, name: str, location: str):
    store = db.query(Store).filter(Store.id == store_id).first()

    if not store:
        return None

    store.name = name
    store.location = location

    db.commit()
    db.refresh(store)

    return store


def delete_store(db: Session, store_id: int):
    store = db.query(Store).filter(Store.id == store_id).first()

    if not store:
        return None

    db.delete(store)
    db.commit()

    return {"message": "Store deleted successfully"}