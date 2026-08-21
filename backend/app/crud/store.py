from sqlalchemy.orm import Session

from app.models.analytics import Analytics
from app.models.notification import Notification
from app.models.shelf import Shelf
from app.models.store import Store


def count_store_dependents(db: Session, store_id: int):
    """
    How much data hangs off a store.

    Shelves, analytics and notifications all carry a foreign key to stores
    with no ON DELETE action, so deleting a store that still has any of them
    fails at the database level. Counting first turns that into a clear
    answer instead of an integrity error.
    """

    return {
        "shelves": db.query(Shelf).filter(Shelf.store_id == store_id).count(),
        "analytics": db.query(Analytics)
        .filter(Analytics.store_id == store_id)
        .count(),
        "notifications": db.query(Notification)
        .filter(Notification.store_id == store_id)
        .count(),
    }


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
    """
    Delete a store that has nothing depending on it.

    Returns None when the store does not exist, or the dependent counts when
    it cannot be deleted. Deleting is deliberately blocked rather than
    cascading: analytics rows and notifications are historical records, and
    removing a store should not silently destroy the history of what happened
    in it. The caller reports what needs clearing first.
    """

    store = db.query(Store).filter(Store.id == store_id).first()

    if not store:
        return None

    dependents = count_store_dependents(db, store_id)

    if any(dependents.values()):
        return {"blocked": True, "dependents": dependents}

    db.delete(store)
    db.commit()

    return {"message": "Store deleted successfully"}