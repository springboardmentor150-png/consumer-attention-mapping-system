import cv2
import numpy as np

# Store all shopper center points
heatmap_points = []


def add_heatmap_point(x, y):
    """
    Store shopper center coordinates.
    """
    heatmap_points.append((x, y))


def get_heatmap_points():
    """
    Return all stored points.
    """
    return heatmap_points
def generate_heatmap(frame, output_path="heatmap.png"):
    """
    Generate a heatmap from stored shopper positions.
    """

    if len(heatmap_points) == 0:
        return

    heat = np.zeros((frame.shape[0], frame.shape[1]), dtype=np.float32)

    # Increase intensity around each shopper position
    for x, y in heatmap_points:
        cv2.circle(heat, (x, y), 25, 1, -1)

    # Smooth the heatmap
    heat = cv2.GaussianBlur(heat, (51, 51), 0)

    # Normalize
    heat = cv2.normalize(
        heat,
        None,
        0,
        255,
        cv2.NORM_MINMAX
)

    heat = heat.astype(np.uint8)

    # Apply colors
    heat = cv2.applyColorMap(
        heat,
        cv2.COLORMAP_JET
)
    # Blend with original frame
    output = cv2.addWeighted(frame, 0.6, heat, 0.4, 0)

    cv2.imwrite(output_path, output)

    return output