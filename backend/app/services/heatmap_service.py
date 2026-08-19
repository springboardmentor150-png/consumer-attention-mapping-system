import cv2

from app.ai.heatmap import HeatmapGenerator


class HeatmapService:

    def __init__(self):
        self.generator = HeatmapGenerator(1280, 720)

    def update(self, detections):
        for box in detections.xyxy:
            x1, y1, x2, y2 = box
            center_x = int((x1 + x2) / 2)
            center_y = int((y1 + y2) / 2)
            self.generator.update(center_x, center_y)

    def create(self):
        return self.generator.generate()

    def save(self):
        image = self.create()
        cv2.imwrite("app/static/heatmaps/latest.png", image)
        return image
