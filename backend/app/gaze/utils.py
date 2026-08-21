import math


def calculate_distance(point1, point2):
    """
    Euclidean distance between two points.
    """

    return math.sqrt(
        (point1[0] - point2[0]) ** 2 +
        (point1[1] - point2[1]) ** 2
    )


def midpoint(point1, point2):
    """
    Midpoint of two points.
    """

    return (
        (point1[0] + point2[0]) / 2,
        (point1[1] + point2[1]) / 2
    )