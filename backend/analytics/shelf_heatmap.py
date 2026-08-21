import cv2
import os

from database import SessionLocal
from services.analytics_service import get_shelf_performance
from ai.zones import SHELF_ZONES


def get_shelf_color(percentage):
    """
    Determine shelf heatmap color based on visitor percentage.
    """

    if percentage >= 60:
        # Red - very high traffic
        return (0, 0, 255)

    elif percentage >= 40:
        # Orange
        return (0, 165, 255)

    elif percentage >= 20:
        # Yellow
        return (0, 255, 255)

    else:
        # Green - low traffic
        return (0, 255, 0)


def generate_shelf_heatmap(background_path):
    """
    Generate a shelf performance heatmap
    using PostgreSQL analytics data.
    """

    # ---------------------------------
    # Load background image
    # ---------------------------------

    frame = cv2.imread(background_path)

    if frame is None:
        raise FileNotFoundError(
            f"Could not open image: {background_path}"
        )

    # ---------------------------------
    # Get database session
    # ---------------------------------

    db = SessionLocal()

    try:

        performance = get_shelf_performance(db)

    finally:

        db.close()

    # ---------------------------------
    # Draw shelf information
    # ---------------------------------

    for shelf in performance:

        shelf_id = shelf["shelf_id"]
        visitors = shelf["visitors"]
        percentage = shelf["percentage"]
        avg_dwell = shelf["average_dwell_time"]

        # Get shelf coordinates
        if shelf_id not in SHELF_ZONES:
            continue

        x1, y1, x2, y2 = SHELF_ZONES[shelf_id]

        # Determine color
        color = get_shelf_color(percentage)

        # ---------------------------------
        # Transparent overlay
        # ---------------------------------

        overlay = frame.copy()

        cv2.rectangle(
            overlay,
            (x1, y1),
            (x2, y2),
            color,
            -1
        )

        # Blend overlay
        frame = cv2.addWeighted(
            overlay,
            0.25,
            frame,
            0.75,
            0
        )

        # ---------------------------------
        # Draw shelf border
        # ---------------------------------

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            color,
            4
        )

        # ---------------------------------
        # Shelf title
        # ---------------------------------

        cv2.putText(
            frame,
            f"Shelf {shelf_id}",
            (x1 + 10, y1 + 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.9,
            color,
            3
        )

        # ---------------------------------
        # Visitor count
        # ---------------------------------

        cv2.putText(
            frame,
            f"Visitors: {visitors}",
            (x1 + 10, y1 + 65),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )

        # ---------------------------------
        # Visitor percentage
        # ---------------------------------

        cv2.putText(
            frame,
            f"Traffic: {percentage:.1f}%",
            (x1 + 10, y1 + 95),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )

        # ---------------------------------
        # Average dwell time
        # ---------------------------------

        cv2.putText(
            frame,
            f"Dwell: {avg_dwell:.1f}s",
            (x1 + 10, y1 + 125),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (255, 255, 255),
            2
        )

    # ---------------------------------
    # Save output
    # ---------------------------------

    output_dir = "heatmaps"

    os.makedirs(
        output_dir,
        exist_ok=True
    )

    output_path = os.path.join(
        output_dir,
        "shelf_performance_heatmap.jpg"
    )

    success = cv2.imwrite(
        output_path,
        frame
    )

    print(
        f"Shelf heatmap saved: {success}"
    )

    print(
        f"Location: {output_path}"
    )

    return output_path

