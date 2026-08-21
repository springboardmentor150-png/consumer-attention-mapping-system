try:
    import mediapipe as mp
except ImportError:
    mp = None


class FaceDetector:

    def __init__(self):
        if mp is None:
            self.mesh = None
            return

        self.mesh = mp.solutions.face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    def detect(self, frame):
        if self.mesh is None:
            return None

        rgb = frame[:, :, ::-1]
        return self.mesh.process(rgb)
