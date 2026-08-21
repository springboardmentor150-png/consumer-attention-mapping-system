import cv2
import numpy as np
import os


class HeatmapGenerator:

    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.heat = np.zeros((height, width), dtype=np.float32)

    def update(self, x, y):
        if 0 <= x < self.width and 0 <= y < self.height:
            cv2.circle(self.heat, (int(x), int(y)), 20, 1, -1)

    def generate(self):
        heat = cv2.GaussianBlur(self.heat, (0, 0), sigmaX=25)
        heat = cv2.normalize(heat, None, 0, 255, cv2.NORM_MINMAX)
        heat = heat.astype(np.uint8)
        return cv2.applyColorMap(heat, cv2.COLORMAP_JET)


def generate_heatmap():
    width = 1000
    height = 600

    heatmap = np.zeros((height, width), dtype=np.float32)

    points = [
        (150, 200),
        (160, 210),
        (170, 220),
        (180, 230),

        (400, 300),
        (410, 310),
        (420, 320),
        (430, 330),
        (440, 340),

        (700, 180),
        (710, 190),
        (720, 200),

        (750, 400),
        (760, 410),
        (770, 420),
        (780, 430),
    ]

    for x, y in points:
        cv2.circle(heatmap, (x, y), 50, 1, -1)

    heatmap = cv2.GaussianBlur(heatmap, (0, 0), sigmaX=30, sigmaY=30)
    heatmap = cv2.normalize(heatmap, None, 0, 255, cv2.NORM_MINMAX)
    heatmap = np.uint8(heatmap)

    colored_heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    background = np.ones((height, width, 3), dtype=np.uint8) * 255

    result = cv2.addWeighted(background, 0.45, colored_heatmap, 0.55, 0)

    output_folder = "app/heatmaps"
    os.makedirs(output_folder, exist_ok=True)
    output_path = os.path.join(output_folder, "store_heatmap.jpg")

    cv2.imwrite(output_path, result)

    return output_path
