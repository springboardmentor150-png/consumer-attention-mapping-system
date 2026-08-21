class GazeEstimator:

    def direction(self, yaw, pitch):
        if yaw < -15:
            return "LEFT"

        if yaw > 15:
            return "RIGHT"

        if pitch < -10:
            return "UP"

        if pitch > 10:
            return "DOWN"

        return "CENTER"
