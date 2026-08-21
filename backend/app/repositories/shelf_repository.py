import numpy as np

from sqlalchemy.orm import Session

from app.models.shelf import Shelf


class ShelfRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_polygons(self):
        shelves = self.db.query(Shelf).all()
        polygons = {}

        for shelf in shelves:
            if shelf.zone_coordinates is None:
                continue
            polygons[shelf.id] = np.array(shelf.zone_coordinates, dtype=np.int32)

        return polygons
