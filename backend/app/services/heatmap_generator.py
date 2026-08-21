import cv2
import numpy as np
import os


class HeatmapGenerator:

    def generate(self, frame, points):

        heatmap = np.zeros(frame.shape[:2], dtype=np.float32)

        for x, y in points:
            cv2.circle(heatmap, (x, y), 25, 1, -1)

        heatmap = cv2.GaussianBlur(heatmap, (0, 0), sigmaX=15, sigmaY=15)

        heatmap = cv2.normalize(heatmap, None, 0, 255, cv2.NORM_MINMAX)

        heatmap = heatmap.astype(np.uint8)

        colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

        output = cv2.addWeighted(frame, 0.55, colored, 0.45, 0)

        os.makedirs("heatmaps", exist_ok=True)

        cv2.imwrite("heatmaps/store_heatmap.png", output)

        print("Heatmap generated successfully.")
