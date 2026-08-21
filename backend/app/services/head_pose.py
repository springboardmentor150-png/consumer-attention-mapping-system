from sixdrepnet import SixDRepNet
import os


class HeadPoseEstimator:

    def __init__(self):

        model_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            "models",
            "6DRepNet_300W_LP_AFLW2000.pth",
        )

        self.model = SixDRepNet(gpu_id=-1, dict_path=model_path)

    def estimate(self, face):

        try:
            pitch, yaw, roll = self.model.predict(face)

            pitch = float(pitch[0])
            yaw = float(yaw[0])
            roll = float(roll[0])

            return pitch, yaw, roll

        except Exception as e:
            print("Head Pose Error:", e)
            return None, None, None

    @staticmethod
    def get_direction(pitch, yaw):

        if pitch is None or yaw is None:
            return "NO FACE"

        # Looking down (phone, basket, lower shelf)
        if pitch <= -35:
            return "DOWN"

        # Looking up
        if pitch >= 35:
            return "UP"

        # Looking left/right
        if yaw <= -30:
            return "LEFT"

        elif yaw >= 30:
            return "RIGHT"

        # Looking straight
        return "CENTER"
