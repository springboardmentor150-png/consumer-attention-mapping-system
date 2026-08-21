import math


class GazeEstimator:
    """
    Converts head pose angles into a gaze direction vector.
    """

    def __init__(self):
        pass

    def estimate_gaze(self, yaw, pitch):
        """
        Convert yaw and pitch angles into a unit gaze vector.

        Args:
            yaw (float)
            pitch (float)

        Returns:
            tuple:
                (x, y, z)
        """

        yaw = math.radians(yaw)
        pitch = math.radians(pitch)

        x = math.sin(yaw)

        y = -math.sin(pitch)

        z = math.cos(yaw) * math.cos(pitch)

        length = math.sqrt(
            x*x +
            y*y +
            z*z
        )

        if length == 0:
            return (0, 0, 1)

        return (
            x / length,
            y / length,
            z / length
        )