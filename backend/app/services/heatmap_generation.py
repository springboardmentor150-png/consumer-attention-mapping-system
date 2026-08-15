import cv2
import numpy as np


class HeatmapGenerator:

    def __init__(self, width=1280, height=720):
        self.width = width
        self.height = height

        self.heatmap = np.zeros(
            (height, width),
            dtype=np.float32
        )


    def add_attention_point(self, x, y):

        if (
            0 <= x < self.width and
            0 <= y < self.height
        ):
            cv2.circle(
                self.heatmap,
                (x, y),
                40,
                5,
                -1
            )


    def generate_heatmap(self):

        normalized = cv2.normalize(
            self.heatmap,
            None,
            0,
            255,
            cv2.NORM_MINMAX
        )

        normalized = normalized.astype(
            np.uint8
        )

        heatmap_image = cv2.applyColorMap(
            normalized,
            cv2.COLORMAP_HOT
        )

        return heatmap_image


    def reset(self):

        self.heatmap = np.zeros(
            (self.height, self.width),
            dtype=np.float32
        )