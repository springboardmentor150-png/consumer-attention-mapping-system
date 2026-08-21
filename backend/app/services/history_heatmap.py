import cv2
import numpy as np


class HistoricalHeatmap:

    def create(self, points, width, height):
        heat = np.zeros((height, width), dtype=np.float32)

        for p in points:
            cv2.circle(heat, (int(p.x), int(p.y)), 18, 1, -1)

        heat = cv2.GaussianBlur(heat, (0, 0), 35)
        heat = cv2.normalize(heat, None, 0, 255, cv2.NORM_MINMAX)
        heat = heat.astype(np.uint8)
        return cv2.applyColorMap(heat, cv2.COLORMAP_JET)
