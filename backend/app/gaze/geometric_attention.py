"""
geometric_attention.py

Geometric Shelf Attention Detection

This module projects the shopper's gaze ray
and determines which shelf the shopper is
looking at.

Author:
Consumer Attention System
"""

from app.gaze.gaze_vector import GazeVector
from app.gaze.shelf_regions import ShelfRegions
from app.gaze.ray_intersection import RayIntersection
from app.gaze.line_rectangle import LineRectangleIntersection


class GeometricAttention:

    def __init__(self):

        self.vector = GazeVector()

        self.shelves = ShelfRegions()

        self.ray = RayIntersection()
        self.line_detector = LineRectangleIntersection()


    # ----------------------------------------------------
    # Detect Shelf Being Viewed
    # ----------------------------------------------------

    def detect_attention(
        self,
        nose_point,
        yaw,
        pitch
    ):

        # ----------------------------------------
        # Calculate Gaze Vector
        # ----------------------------------------

        direction = self.vector.calculate_vector(
            yaw,
            pitch
        )

        # ----------------------------------------
        # Project Ray
        # ----------------------------------------

        start_point, end_point = self.ray.project_ray(
            nose_point,
            yaw,
            pitch
        )

        # ----------------------------------------
        # Find Shelf
        # ----------------------------------------
        attention = False

        shelf = "None"

        nearest_distance = float("inf")

        all_shelves = self.shelves.get_all_shelves()

        for shelf_name, rectangle in all_shelves.items():

            if self.line_detector.intersects_rectangle(

                start_point,

                end_point,

                rectangle

            ):

                distance = self.line_detector.distance_to_rectangle(

                    start_point,

                    rectangle

                )

                if distance < nearest_distance:

                    nearest_distance = distance

                    shelf = shelf_name

                    attention = True
            
        return {

            "attention": attention,

            "shelf": shelf,

            "start_point": start_point,

            "end_point": end_point,

            "direction": direction

        }

    # ----------------------------------------------------
    # Draw Gaze Ray
    # ----------------------------------------------------

    def draw(
        self,
        frame,
        result
    ):

        self.ray.draw_ray(

            frame,

            result["start_point"],

            result["end_point"]

        )

        x, y = result["end_point"]

        if result["attention"]:

            color = (0,255,0)

        else:

            color = (0,0,255)

        import cv2

        cv2.putText(

            frame,

            result["shelf"],

            (x + 5, y),

            cv2.FONT_HERSHEY_SIMPLEX,

            0.6,

            color,

            2

        )


# ----------------------------------------------------
# Test
# ----------------------------------------------------

if __name__ == "__main__":

    detector = GeometricAttention()

    result = detector.detect_attention(

        nose_point=(320,240),

        yaw=20,

        pitch=-5

    )

    print()

    print("Attention :", result["attention"])

    print("Shelf     :", result["shelf"])

    print("Start     :", result["start_point"])

    print("End       :", result["end_point"])

    print("Vector    :", result["direction"])