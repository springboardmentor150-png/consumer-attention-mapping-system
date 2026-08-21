from app.models.heatmap_point import HeatmapPoint


class HeatmapRepository:

    def __init__(self, db):
        self.db = db

    def save(self, person, store, shelf, x, y):
        point = HeatmapPoint(
            person_id=person,
            store_id=store,
            shelf_id=shelf,
            x=x,
            y=y,
        )
        self.db.add(point)
        self.db.commit()

    def get_all(self):
        return self.db.query(HeatmapPoint).all()

    def get_by_shelf(self, shelf_id):
        return self.db.query(HeatmapPoint).filter(HeatmapPoint.shelf_id == shelf_id).all()

    def get_since(self, start):
        return self.db.query(HeatmapPoint).filter(HeatmapPoint.timestamp >= start).all()

    def get_range(self, start, end):
        return self.db.query(HeatmapPoint).filter(HeatmapPoint.timestamp >= start, HeatmapPoint.timestamp <= end).all()
