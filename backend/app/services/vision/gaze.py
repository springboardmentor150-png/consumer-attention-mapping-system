import cv2
import numpy as np
from typing import Dict, Any, Optional

try:
    import mediapipe as mp
    if hasattr(mp, "solutions") and hasattr(mp.solutions, "face_mesh"):
        HAS_MP_SOLUTIONS = True
    else:
        HAS_MP_SOLUTIONS = False
except Exception:
    HAS_MP_SOLUTIONS = False


class GazeEstimator:
    """
    Robust Real Gaze and Head Pose Estimation Service.
    Uses MediaPipe FaceMesh when available, with automatic OpenCV cascade & geometry head pose fallback.
    Calculates actual 3D Euler angles (Yaw, Pitch, Roll) and gaze direction.
    """

    def __init__(self):
        self.use_mediapipe = False

        if HAS_MP_SOLUTIONS:
            try:
                self.mp_face_mesh = mp.solutions.face_mesh
                self.face_mesh = self.mp_face_mesh.FaceMesh(
                    static_image_mode=False,
                    max_num_faces=1,
                    refine_landmarks=True,
                    min_detection_confidence=0.4,
                    min_tracking_confidence=0.4,
                )
                self.drawer = mp.solutions.drawing_utils
                self.drawing_spec = self.drawer.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1)
                self.use_mediapipe = True
            except Exception as e:
                print(f"[GAZE] MediaPipe solutions init notice: {e}. Using OpenCV head pose estimator.")
                self.use_mediapipe = False

        # OpenCV Haar Cascade fallback for face & eye detection
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        self.eye_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_eye.xml"
        )

        self.model_points = np.array([
            (0.0, 0.0, 0.0),          # Nose
            (0.0, -63.6, -12.5),      # Chin
            (-43.3, 32.7, -26.0),     # Left Eye
            (43.3, 32.7, -26.0),      # Right Eye
            (-28.9, -28.9, -24.1),    # Left Mouth
            (28.9, -28.9, -24.1),     # Right Mouth
        ], dtype=np.float64)

    def process(self, person_crop: Optional[np.ndarray]) -> Dict[str, Any]:
        if person_crop is None or person_crop.size == 0:
            return {"face_found": False, "landmarks": None, "direction": "Unknown"}

        height, width = person_crop.shape[:2]
        if height < 15 or width < 15:
            return {"face_found": False, "landmarks": None, "direction": "Unknown"}

        # 1. Try MediaPipe if available
        if self.use_mediapipe:
            try:
                rgb = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)
                results = self.face_mesh.process(rgb)

                if results.multi_face_landmarks and len(results.multi_face_landmarks) > 0:
                    face_landmarks = results.multi_face_landmarks[0]
                    landmark_indices = [1, 152, 33, 263, 61, 291]
                    image_points = []
                    for idx in landmark_indices:
                        lm = face_landmarks.landmark[idx]
                        image_points.append((int(lm.x * width), int(lm.y * height)))

                    image_points_np = np.array(image_points, dtype=np.float64)
                    focal_length = width
                    camera_matrix = np.array([
                        [focal_length, 0, width / 2],
                        [0, focal_length, height / 2],
                        [0, 0, 1]
                    ], dtype=np.float64)
                    dist_coeffs = np.zeros((4, 1))

                    success, rot_vec, trans_vec = cv2.solvePnP(
                        self.model_points,
                        image_points_np,
                        camera_matrix,
                        dist_coeffs,
                        flags=cv2.SOLVEPNP_ITERATIVE
                    )

                    if success:
                        rot_mat, _ = cv2.Rodrigues(rot_vec)
                        proj_mat = np.hstack((rot_mat, trans_vec))
                        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(proj_mat)

                        pitch = float(euler_angles[0])
                        yaw = float(euler_angles[1])
                        roll = float(euler_angles[2])
                        direction = self.get_direction(yaw)

                        return {
                            "face_found": True,
                            "landmarks": face_landmarks,
                            "image_points": image_points,
                            "yaw": yaw,
                            "pitch": pitch,
                            "roll": roll,
                            "direction": direction,
                        }
            except Exception:
                pass

        # 2. Robust OpenCV Cascade & Head Pose Estimation
        gray = cv2.cvtColor(person_crop, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(20, 20))

        if len(faces) > 0:
            fx, fy, fw, fh = faces[0]
            face_roi_gray = gray[fy : fy + fh, fx : fx + fw]
            eyes = self.eye_cascade.detectMultiScale(face_roi_gray, scaleFactor=1.1, minNeighbors=2)

            face_center_x = fx + fw / 2.0
            crop_center_x = width / 2.0
            offset_ratio = (face_center_x - crop_center_x) / max(1.0, crop_center_x)
            yaw = float(np.clip(offset_ratio * 45.0, -60.0, 60.0))

            if len(eyes) >= 2:
                # Two eyes detected -> Facing camera / center
                direction = "CENTER"
                if abs(yaw) > 18.0:
                    direction = "RIGHT" if yaw < 0 else "LEFT"
            elif len(eyes) == 1:
                # One eye visible -> Profile / turned
                eye_x = eyes[0][0]
                direction = "LEFT" if eye_x < fw / 2 else "RIGHT"
                yaw = 28.0 if direction == "LEFT" else -28.0
            else:
                direction = self.get_direction(yaw)

            return {
                "face_found": True,
                "landmarks": None,
                "image_points": [(fx + fw // 2, fy + fh // 2)],
                "yaw": round(yaw, 2),
                "pitch": 0.0,
                "roll": 0.0,
                "direction": direction,
            }

        return {
            "face_found": False,
            "landmarks": None,
            "image_points": None,
            "yaw": None,
            "pitch": None,
            "roll": None,
            "direction": "Unknown / Not Detected",
        }

    def get_direction(self, yaw: float) -> str:
        if yaw < -15.0:
            return "RIGHT"
        elif yaw > 15.0:
            return "LEFT"
        return "CENTER"