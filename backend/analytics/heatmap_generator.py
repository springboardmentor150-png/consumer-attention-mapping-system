import cv2
import numpy as np

# Store all tracking points
heatmap_points = []


def add_point(x, y):
    """Store a tracking point."""
    heatmap_points.append((x, y))


def generate_heatmap(frame_width, frame_height):

    heatmap = np.zeros(
        (frame_height, frame_width),
        dtype=np.float32
    )

    for x, y in heatmap_points:

        cv2.circle(
            heatmap,
            (x, y),
            35,
            1,
            -1
        )

    heatmap = cv2.GaussianBlur(
        heatmap,
        (51, 51),
        0
    )

    heatmap = cv2.normalize(
        heatmap,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    heatmap = heatmap.astype(np.uint8)

    colored = cv2.applyColorMap(
        heatmap,
        cv2.COLORMAP_JET
    )

    cv2.imwrite(
        "heatmaps/store_heatmap.png",
        colored
    )

    return colored