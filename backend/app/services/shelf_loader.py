from sqlalchemy.orm import Session
from app.models.shelf import Shelf


def load_shelf_regions(db: Session):

    shelves = db.query(Shelf).all()

    shelf_dict = {}

    for shelf in shelves:

        shelf_dict[shelf.name] = (
            shelf.x1,
            shelf.y1,
            shelf.x2,
            shelf.y2
        )

    return shelf_dict