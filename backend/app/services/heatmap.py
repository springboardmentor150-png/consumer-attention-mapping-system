import cv2
import numpy as np
import os


def generate_heatmap(points, base_frame, output_path):
    """
    Generate a shopper traffic heatmap from accumulated
    (x, y) coordinates.

    points:
        list of (x, y) coordinates

    base_frame:
        original camera frame used as the background

    output_path:
        location where the heatmap image is saved
    """

    if not points:
        print("No heatmap points available.")
        return None

    height, width = base_frame.shape[:2]

    # --------------------------------------------------
    # Create density map
    # --------------------------------------------------

    heatmap = np.zeros(
        (height, width),
        dtype=np.float32
    )

    # Add one unit of attention/traffic
    # for every shopper position
    for x, y in points:

        x = int(x)
        y = int(y)

        if (
            0 <= x < width
            and 0 <= y < height
        ):
            heatmap[y, x] += 1

    # --------------------------------------------------
    # Smooth the density
    # --------------------------------------------------

    heatmap = cv2.GaussianBlur(
        heatmap,
        (0, 0),
        sigmaX=25,
        sigmaY=25
    )

    # --------------------------------------------------
    # Normalize to 0-255
    # --------------------------------------------------

    normalized = cv2.normalize(
        heatmap,
        None,
        0,
        255,
        cv2.NORM_MINMAX
    )

    normalized = normalized.astype(
        np.uint8
    )

    # --------------------------------------------------
    # Apply color map
    # --------------------------------------------------

    colored_heatmap = cv2.applyColorMap(
        normalized,
        cv2.COLORMAP_JET
    )

    # --------------------------------------------------
    # Blend with camera image
    # --------------------------------------------------

    overlay = cv2.addWeighted(
        base_frame,
        0.55,
        colored_heatmap,
        0.45,
        0
    )

    # --------------------------------------------------
    # Save
    # --------------------------------------------------

    os.makedirs(
        os.path.dirname(output_path),
        exist_ok=True
    )

    cv2.imwrite(
        output_path,
        overlay
    )

    print(
        f"Heatmap saved to: {output_path}"
    )

    return output_path