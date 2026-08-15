import cv2
import mediapipe as mp


class GazeEstimator:

    def __init__(self):
        self.face_detection = mp.tasks.vision.FaceLandmarker

    def estimate_gaze(self, frame):

        # Temporary lightweight gaze estimation
        # based on face position

        height, width, _ = frame.shape

        rgb = cv2.cvtColor(
            frame,
            cv2.COLOR_BGR2RGB
        )

        # Placeholder until face landmark model is added
        # Uses frame center movement as attention direction

        center_x = width // 2

        gaze_result = []

        gaze_result.append(
            {
                "direction": "center",
                "x": center_x / width,
                "y": 0.5
            }
        )

        return gaze_result