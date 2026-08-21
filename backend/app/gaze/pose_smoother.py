from collections import deque


class PoseSmoother:

    def __init__(self, window_size=5):

        self.window_size = window_size

        self.yaw_history = deque(maxlen=window_size)

        self.pitch_history = deque(maxlen=window_size)

        self.roll_history = deque(maxlen=window_size)

    def smooth(self, yaw, pitch, roll):

        self.yaw_history.append(yaw)

        self.pitch_history.append(pitch)

        self.roll_history.append(roll)

        smooth_yaw = sum(self.yaw_history) / len(self.yaw_history)

        smooth_pitch = sum(self.pitch_history) / len(self.pitch_history)

        smooth_roll = sum(self.roll_history) / len(self.roll_history)

        return (
            smooth_yaw,
            smooth_pitch,
            smooth_roll
        )