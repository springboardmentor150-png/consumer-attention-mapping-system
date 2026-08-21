import cv2


class ShelfMapper:

    def __init__(self, polygons):
        self.polygons = polygons

    def detect(self, point):
        for shelf_id, polygon in self.polygons.items():
            if cv2.pointPolygonTest(polygon, point, False) >= 0:
                return shelf_id

        return None
