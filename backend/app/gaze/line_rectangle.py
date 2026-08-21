"""
line_rectangle.py

Line vs Rectangle Intersection

Author:
Consumer Attention System
"""

import cv2
import math


class LineRectangleIntersection:

    def __init__(self):
        pass

    # -----------------------------------------
    # Check if point lies inside rectangle
    # -----------------------------------------

    @staticmethod
    def point_inside(point, rect):

        px, py = point

        x1, y1, x2, y2 = rect

        return (

            x1 <= px <= x2

            and

            y1 <= py <= y2

        )

    # -----------------------------------------
    # Line Intersection
    # -----------------------------------------

    @staticmethod
    def ccw(A, B, C):

        return (

            (C[1]-A[1])*(B[0]-A[0])

            >

            (B[1]-A[1])*(C[0]-A[0])

        )

    @classmethod
    def intersect(cls, A, B, C, D):

        return (

            cls.ccw(A, C, D)

            !=

            cls.ccw(B, C, D)

        ) and (

            cls.ccw(A, B, C)

            !=

            cls.ccw(A, B, D)

        )

    # -----------------------------------------
    # Line vs Rectangle
    # -----------------------------------------

    def intersects_rectangle(
        self,
        start,
        end,
        rectangle
    ):

        x1, y1, x2, y2 = rectangle

        # Rectangle corners

        tl = (x1, y1)

        tr = (x2, y1)

        br = (x2, y2)

        bl = (x1, y2)

        # If ray starts inside rectangle

        if self.point_inside(start, rectangle):
            return True

        # If ray ends inside rectangle

        if self.point_inside(end, rectangle):
            return True

        # Check every edge

        edges = [

            (tl, tr),

            (tr, br),

            (br, bl),

            (bl, tl)

        ]

        for edge in edges:

            if self.intersect(

                start,

                end,

                edge[0],

                edge[1]

            ):

                return True

        return False
    
    

    def distance_to_rectangle(
        self,
        point,
        rectangle
    ):

        px, py = point

        x1, y1, x2, y2 = rectangle

        center_x = (x1 + x2) / 2
        center_y = (y1 + y2) / 2

        distance = math.sqrt(

            (center_x - px) ** 2 +

            (center_y - py) ** 2

        )

        return distance
    # -----------------------------------------
    # Draw Rectangle
    # -----------------------------------------

    @staticmethod
    def draw_rectangle(
        frame,
        rectangle,
        color=(0,255,0)
    ):

        x1,y1,x2,y2 = rectangle

        cv2.rectangle(

            frame,

            (x1,y1),

            (x2,y2),

            color,

            2

        )


# -------------------------------------------------
# Test
# -------------------------------------------------

if __name__ == "__main__":

    detector = LineRectangleIntersection()

    shelf = (300,150,500,350)

    start = (100,250)

    end = (600,250)

    print()

    print(

        detector.intersects_rectangle(

            start,

            end,

            shelf

        )

    )

    print()