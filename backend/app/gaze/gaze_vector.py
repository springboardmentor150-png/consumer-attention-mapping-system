"""
gaze_vector.py

Converts head pose angles (Yaw, Pitch)
into a normalized 3D gaze direction vector.

Author:
Consumer Attention System
"""

import math
import numpy as np


class GazeVector:
    """
    Converts Yaw and Pitch into
    a 3D direction vector.
    """

    def __init__(self):
        pass

    @staticmethod
    def calculate_vector(yaw: float,
                         pitch: float):
        """
        Parameters
        ----------
        yaw : float
            Head yaw in degrees.

        pitch : float
            Head pitch in degrees.

        Returns
        -------
        numpy.ndarray

        [dx, dy, dz]
        Normalized 3D direction vector.
        """

        # -----------------------------
        # Convert Degrees -> Radians
        # -----------------------------
        yaw_rad = math.radians(yaw)
        pitch_rad = math.radians(pitch)

        # -----------------------------
        # Compute Direction
        # -----------------------------
        dx = math.sin(yaw_rad) * math.cos(pitch_rad)

        dy = -math.sin(pitch_rad)

        dz = math.cos(yaw_rad) * math.cos(pitch_rad)

        vector = np.array(
            [dx, dy, dz],
            dtype=np.float32
        )

        # -----------------------------
        # Normalize Vector
        # -----------------------------
        norm = np.linalg.norm(vector)

        if norm == 0:
            return np.array(
                [0.0, 0.0, 1.0],
                dtype=np.float32
            )

        vector /= norm

        return vector

    @staticmethod
    def project_to_image(
            nose_point,
            vector,
            length=250
    ):
        """
        Projects the 3D vector
        into image coordinates.

        Parameters
        ----------
        nose_point : tuple

            (x,y)

        vector : numpy.ndarray

            Direction vector

        length : int

            Projection length

        Returns
        -------
        start_point
        end_point
        """

        x, y = nose_point

        end_x = int(
            x + vector[0] * length
        )

        end_y = int(
            y + vector[1] * length
        )

        return (
            (int(x), int(y)),
            (end_x, end_y)
        )


# --------------------------------------------------
# Standalone Test
# --------------------------------------------------

if __name__ == "__main__":

    gaze = GazeVector()

    yaw = 20
    pitch = -10

    vector = gaze.calculate_vector(
        yaw,
        pitch
    )

    print("Direction Vector")

    print(vector)

    start, end = gaze.project_to_image(
        (320, 240),
        vector
    )

    print("Start :", start)

    print("End   :", end)