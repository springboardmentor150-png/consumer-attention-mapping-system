import os
import cv2
import numpy as np


class HeatmapService:

    def __init__(self):

        self.points = []

        self.output_folder = "heatmaps"

        os.makedirs(self.output_folder, exist_ok=True)


    def add_point(self, x, y):

        self.points.append((int(x), int(y)))


    def generate_heatmap(self, frame):

        height, width = frame.shape[:2]

        heat = np.zeros((height, width), dtype=np.float32)

        for x, y in self.points:

            if 0 <= x < width and 0 <= y < height:

                heat[y, x] += 1

        heat = cv2.GaussianBlur(
            heat,
            (51, 51),
            0
        )

        heat = cv2.normalize(
            heat,
            None,
            0,
            255,
            cv2.NORM_MINMAX
        )

        heat = heat.astype(np.uint8)

        heat_color = cv2.applyColorMap(
            heat,
            cv2.COLORMAP_JET
        )

        overlay = cv2.addWeighted(
            frame,
            0.6,
            heat_color,
            0.4,
            0
        )

        output = os.path.join(
            self.output_folder,
            "store_heatmap.png"
        )

        cv2.imwrite(output, overlay)

        return output


heatmap_service = HeatmapService()