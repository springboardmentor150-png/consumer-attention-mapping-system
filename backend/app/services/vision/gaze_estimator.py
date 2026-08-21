"""
Pure OpenCV gaze estimator — no MediaPipe, no TensorFlow dependency.
Uses Haar cascade face/eye detection built into opencv-python.
"""

import cv2
import numpy as np
from typing import Optional, Dict, Any, List
from loguru import logger


class GazeEstimator:
    """
    Estimates head pose (yaw/pitch/roll) and shelf attention using
    OpenCV Haar cascades. No MediaPipe or TensorFlow required.
    """

    def __init__(self):
        self._initialized = False
        self.face_cascade: Optional[cv2.CascadeClassifier] = None
        self.eye_cascade: Optional[cv2.CascadeClassifier] = None

    def initialize(self):
        if self._initialized:
            return
        try:
            face_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            eye_path  = cv2.data.haarcascades + "haarcascade_eye.xml"

            self.face_cascade = cv2.CascadeClassifier(face_path)
            self.eye_cascade  = cv2.CascadeClassifier(eye_path)

            if self.face_cascade.empty():
                raise RuntimeError("Haar face cascade failed to load")

            self._initialized = True
            logger.info("OpenCV Haar cascade gaze estimator initialized (no MediaPipe/TF needed).")
        except Exception as e:
            logger.error(f"GazeEstimator init error: {e}")
            raise

    def estimate(
        self,
        frame: np.ndarray,
        bbox: List[float],
    ) -> Dict[str, Any]:
        """
        Estimate gaze from a single video frame and person bounding box.

        Parameters
        ----------
        frame : BGR numpy array (H, W, 3)
        bbox  : [x1, y1, x2, y2] pixel coordinates of the detected person

        Returns
        -------
        dict with keys: yaw, pitch, roll (degrees), is_looking_at_shelf (bool)
        """
        if not self._initialized:
            self.initialize()

        try:
            x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
            h, w = frame.shape[:2]

            # Clamp to frame
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            # Crop only the upper 45 % of the person box — likely the head
            face_y2 = y1 + int((y2 - y1) * 0.45)
            crop = frame[y1:face_y2, x1:x2]

            if crop.size == 0 or crop.shape[0] < 20 or crop.shape[1] < 20:
                return self._bbox_fallback(frame, bbox)

            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
            gray = cv2.equalizeHist(gray)

            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(30, 30),
            )

            if len(faces) == 0:
                # No frontal face — use bbox-centre heuristic
                return self._bbox_fallback(frame, bbox)

            # Largest face wins
            fx, fy, fw, fh = max(faces, key=lambda f: f[2] * f[3])

            # ── Yaw: horizontal offset of face centre vs crop centre ──
            crop_cx = crop.shape[1] / 2.0
            face_cx = fx + fw / 2.0
            yaw = ((face_cx - crop_cx) / (crop_cx + 1e-6)) * 45.0   # ±45 °

            # ── Pitch: vertical offset of face centre vs crop centre ──
            crop_cy = crop.shape[0] / 2.0
            face_cy = fy + fh / 2.0
            pitch = ((face_cy - crop_cy) / (crop_cy + 1e-6)) * 30.0  # ±30 °

            # ── Roll: estimated from eye-line angle ──
            roll = 0.0
            face_gray = gray[fy : fy + fh, fx : fx + fw]
            eyes = self.eye_cascade.detectMultiScale(
                face_gray,
                scaleFactor=1.1,
                minNeighbors=3,
                minSize=(15, 15),
            )
            if len(eyes) >= 2:
                e1, e2 = sorted(eyes[:2], key=lambda e: e[0])
                dx = (e2[0] + e2[2] / 2) - (e1[0] + e1[2] / 2)
                dy = (e2[1] + e2[3] / 2) - (e1[1] + e1[3] / 2)
                roll = float(np.degrees(np.arctan2(dy, dx + 1e-6)))

            # Shopper is "looking at shelf" when roughly facing forward
            is_looking = abs(yaw) < 22.0 and abs(pitch) < 18.0

            return {
                "yaw":               float(yaw),
                "pitch":             float(pitch),
                "roll":              float(roll),
                "is_looking_at_shelf": is_looking,
            }

        except Exception as exc:
            logger.warning(f"Gaze estimation failed: {exc}")
            return self._default_result()

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _bbox_fallback(self, frame: np.ndarray, bbox: List[float]) -> Dict[str, Any]:
        """Estimate rough yaw from person-box centre vs frame centre."""
        x1, _, x2, _ = bbox
        frame_cx   = frame.shape[1] / 2.0
        person_cx  = (x1 + x2) / 2.0
        yaw = ((person_cx - frame_cx) / (frame_cx + 1e-6)) * 30.0
        return {
            "yaw":               float(yaw),
            "pitch":             0.0,
            "roll":              0.0,
            "is_looking_at_shelf": abs(yaw) < 22.0,
        }

    def _default_result(self) -> Dict[str, Any]:
        return {"yaw": 0.0, "pitch": 0.0, "roll": 0.0, "is_looking_at_shelf": True}
