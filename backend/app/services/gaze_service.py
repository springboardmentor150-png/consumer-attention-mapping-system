import cv2
import numpy as np

from app.ai.face_detector import FaceDetector
from app.ai.head_pose import HeadPoseEstimator
from app.ai.gaze_estimator import GazeEstimator
from app.ai.face_utils import CHIN, NOSE, landmark_to_pixel


class GazeService:

    def __init__(self):
        self.face = FaceDetector()
        self.pose = HeadPoseEstimator()
        self.gaze = GazeEstimator()

    def process(self, frame):
        result = self.face.detect(frame)

        h, w, _ = frame.shape

        if result is None or not getattr(result, "multi_face_landmarks", None):
            return frame, None

        landmarks = result.multi_face_landmarks[0]

        nose = landmark_to_pixel(landmarks.landmark[NOSE], w, h)
        chin = landmark_to_pixel(landmarks.landmark[CHIN], w, h)
        left = landmark_to_pixel(landmarks.landmark[33], w, h)
        right = landmark_to_pixel(landmarks.landmark[263], w, h)

        image_points = np.array([nose, chin, left, right], dtype="double")

        angles = self.pose.estimate(image_points, frame.shape)

        pitch = float(angles[0])
        yaw = float(angles[1])
        roll = float(angles[2])

        direction = self.gaze.direction(yaw, pitch)

        cv2.putText(
            frame,
            f"Gaze: {direction}",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2,
        )
        cv2.putText(
            frame,
            f"Yaw: {yaw:.2f}",
            (20, 80),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 0, 0),
            2,
        )
        cv2.putText(
            frame,
            f"Pitch: {pitch:.2f}",
            (20, 110),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 0, 0),
            2,
        )
        cv2.putText(
            frame,
            f"Roll: {roll:.2f}",
            (20, 140),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 0, 0),
            2,
        )

        return frame, {
            "yaw": yaw,
            "pitch": pitch,
            "roll": roll,
            "direction": direction,
        }
