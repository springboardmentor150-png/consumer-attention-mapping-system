import math


class GazeProjection:

    def project(self, face_center, yaw, length=250):
        x, y = face_center
        angle = math.radians(yaw)
        end_x = x + length * math.sin(angle)
        end_y = y - length * math.cos(angle)
        return (int(end_x), int(end_y))
