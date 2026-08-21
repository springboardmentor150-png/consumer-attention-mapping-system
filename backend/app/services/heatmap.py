import os
import cv2
import numpy as np

HEATMAP_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../static/heatmaps"))
os.makedirs(HEATMAP_DIR, exist_ok=True)

def generate_store_heatmap(frame_shape, points, output_filename="latest_heatmap.png"):
    """
    Generates a spatial density heatmap from shopper (X, Y) coordinate points and saves it to static storage.
    """
    height, width = frame_shape[:2]
    accum_array = np.zeros((height, width), dtype=np.float32)

    if not points:
        blank_bg = np.zeros((height, width, 3), dtype=np.uint8)
        output_path = os.path.join(HEATMAP_DIR, output_filename)
        cv2.imwrite(output_path, blank_bg)
        return output_path

    for pt in points:
        x, y = int(pt[0]), int(pt[1])
        if 0 <= x < width and 0 <= y < height:
            accum_array[y, x] += 1.0

    blurred = cv2.GaussianBlur(accum_array, (51, 51), 0)
    norm_map = cv2.normalize(blurred, None, alpha=0, beta=255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
    color_heatmap = cv2.applyColorMap(norm_map, cv2.COLORMAP_JET)

    output_path = os.path.join(HEATMAP_DIR, output_filename)
    cv2.imwrite(output_path, color_heatmap)
    print(f"Heatmap successfully saved to: {output_path}")
    return output_path