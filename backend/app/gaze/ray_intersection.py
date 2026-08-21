"""
ray_intersection.py

Projects the gaze ray into the image and
checks where it ends.

Author:
Consumer Attention System
"""

import math
import cv2


class RayIntersection:

    def __init__(self, ray_length=1000):
        """
        ray_length:
            Length of projected gaze ray
        """
        self.ray_length = ray_length

    # -------------------------------------------------------
    # Project Ray
    # -------------------------------------------------------

    def project_ray(
        self,
        nose_point,
        yaw,
        pitch
    ):
        """
        Parameters
        ----------
        nose_point : tuple
            (x,y)

        yaw : float

        pitch : float

        Returns
        -------
        start_point
        end_point
        """

        x, y = nose_point

        yaw = math.radians(yaw)
        pitch = math.radians(pitch)

        dx = math.sin(yaw)

        dy = -math.sin(pitch)

        end_x = int(
            x + dx * self.ray_length
        )

        end_y = int(
            y + dy * self.ray_length
        )

        return (
            (int(x), int(y)),
            (end_x, end_y)
        )

    # -------------------------------------------------------
    # Draw Ray
    # -------------------------------------------------------

    def draw_ray(
        self,
        frame,
        start_point,
        end_point,
        color=(255, 0, 0)
    ):

        cv2.arrowedLine(
            frame,
            start_point,
            end_point,
            color,
            2,
            tipLength=0.25
        )

        cv2.circle(
            frame,
            start_point,
            4,
            (0,255,255),
            -1
        )

        cv2.circle(
            frame,
            end_point,
            5,
            (0,0,255),
            -1
        )

    # -------------------------------------------------------
    # Point Inside Rectangle
    # -------------------------------------------------------

    def point_inside_rectangle(
        self,
        point,
        rectangle
    ):

        px, py = point

        x1, y1, x2, y2 = rectangle

        return (

            x1 <= px <= x2

            and

            y1 <= py <= y2

        )


# -------------------------------------------------------
# Test
# -------------------------------------------------------

if __name__ == "__main__":

    ray = RayIntersection()

    nose = (320,240)

    start,end = ray.project_ray(

        nose,

        yaw=20,

        pitch=-8

    )

    print()

    print("Start :",start)

    print("End   :",end)

    print()