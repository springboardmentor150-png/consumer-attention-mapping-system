import cv2

from app.ai.zones import SHELF_ZONES


class ZoneChecker:

    def get_shelf(self, center):
        x, y = center
        for shelf_id, polygon in SHELF_ZONES.items():
            inside = cv2.pointPolygonTest(polygon, (int(x), int(y)), False)
            if inside >= 0:
                return shelf_id
        return None
