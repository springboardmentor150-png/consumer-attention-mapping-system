"""
Head-Pose Based Attention Estimator
Uses MediaPipe FaceMesh to estimate head orientation (yaw/pitch).
Maps gaze direction to shelf/product ROIs to estimate attention.

IMPORTANT DISCLAIMER:
This module estimates attention based on HEAD POSE (yaw/pitch angles)
computed from facial landmarks. This is NOT true eye tracking.
Results are labeled as "Estimated Attention" throughout the system.
Do not claim medical-grade or calibrated gaze accuracy.
"""

import os
import logging
import numpy as np
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Gaze threshold angles (degrees) for shelf/product attention
YAW_THRESHOLD = float(os.getenv("GAZE_YAW_THRESHOLD", "25.0"))   # horizontal
PITCH_THRESHOLD = float(os.getenv("GAZE_PITCH_THRESHOLD", "20.0"))  # vertical
ATTENTION_CONFIDENCE_HEAD_POSE = 0.65   # confidence for head-pose based estimate


@dataclass
class HeadPoseResult:
    """Result from head pose estimation."""
    detected: bool
    yaw: Optional[float] = None         # degrees, negative=left, positive=right
    pitch: Optional[float] = None       # degrees, negative=up, positive=down
    roll: Optional[float] = None
    gaze_direction: Optional[str] = None  # "left", "right", "up", "down", "forward"
    confidence: float = 0.0
    is_estimated: bool = True            # Always True — this is head-pose, not eye-tracking
    face_bbox: Optional[Tuple] = None   # x1,y1,x2,y2 normalized


class HeadPoseAttentionEstimator:
    """
    Estimates shopper attention direction using MediaPipe FaceMesh.
    Maps estimated gaze to shelf/product regions of interest.
    
    This is a HEAD-POSE estimation system, NOT true eye-tracking.
    All attention results must be labeled as ESTIMATED ATTENTION.
    """

    def __init__(self, min_detection_confidence: float = 0.5):
        self.min_detection_confidence = min_detection_confidence
        self._mp_face_mesh = None
        self._face_mesh = None
        self._init_mediapipe()

    def _init_mediapipe(self):
        """Initialize MediaPipe FaceMesh."""
        try:
            import mediapipe as mp
            self._mp_face_mesh = mp.solutions.face_mesh
            self._face_mesh = self._mp_face_mesh.FaceMesh(
                static_image_mode=False,
                max_num_faces=10,  # Multi-person
                refine_landmarks=True,
                min_detection_confidence=self.min_detection_confidence,
                min_tracking_confidence=0.4
            )
            logger.info("MediaPipe FaceMesh initialized for head-pose estimation")
        except ImportError:
            logger.warning("MediaPipe not available — attention estimation will use proximity heuristic")
            self._face_mesh = None
        except Exception as e:
            logger.error(f"MediaPipe init failed: {e}")
            self._face_mesh = None

    @property
    def is_available(self) -> bool:
        return self._face_mesh is not None

    def estimate_head_pose(self, frame: np.ndarray, person_bbox: Tuple) -> HeadPoseResult:
        """
        Estimate head pose for a detected person.
        Crops to person bbox region for better face detection.
        
        Args:
            frame: Full video frame (BGR numpy array)
            person_bbox: Normalized (x1, y1, x2, y2) of person bounding box
            
        Returns:
            HeadPoseResult with yaw/pitch angles and gaze direction
        """
        if self._face_mesh is None:
            return self._heuristic_attention(person_bbox)

        try:
            import cv2
            h, w = frame.shape[:2]
            x1, y1, x2, y2 = person_bbox

            # Crop to person region (upper 40% — head area)
            px1 = max(0, int(x1 * w))
            py1 = max(0, int(y1 * h))
            px2 = min(w, int(x2 * w))
            py2 = min(h, int((y1 + (y2 - y1) * 0.4) * h))  # upper body

            if px2 <= px1 or py2 <= py1:
                return HeadPoseResult(detected=False)

            crop = frame[py1:py2, px1:px2]
            if crop.size == 0:
                return HeadPoseResult(detected=False)

            rgb_crop = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
            results = self._face_mesh.process(rgb_crop)

            if not results.multi_face_landmarks:
                return HeadPoseResult(detected=False, confidence=0.0)

            landmarks = results.multi_face_landmarks[0].landmark
            yaw, pitch, roll = self._compute_angles(landmarks, crop.shape[:2])

            gaze = self._angles_to_direction(yaw, pitch)

            # Face bbox in original frame coordinates (normalized)
            face_bbox = (
                px1 / w, py1 / h,
                px2 / w, py2 / h
            )

            return HeadPoseResult(
                detected=True,
                yaw=yaw,
                pitch=pitch,
                roll=roll,
                gaze_direction=gaze,
                confidence=ATTENTION_CONFIDENCE_HEAD_POSE,
                is_estimated=True,
                face_bbox=face_bbox
            )

        except Exception as e:
            logger.debug(f"Head pose estimation failed: {e}")
            return HeadPoseResult(detected=False)

    def _compute_angles(
        self, landmarks, shape: Tuple[int, int]
    ) -> Tuple[float, float, float]:
        """
        Compute yaw, pitch, roll from MediaPipe face landmarks.
        Uses key facial points for pose estimation via solvePnP.
        """
        import cv2
        h, w = shape

        # Key landmark indices for head pose (MediaPipe FaceMesh)
        # Nose tip, chin, left eye corner, right eye corner, left mouth, right mouth
        KEY_POINTS = [1, 152, 226, 446, 57, 287]

        model_points = np.array([
            [0.0, 0.0, 0.0],          # Nose tip
            [0.0, -330.0, -65.0],     # Chin
            [-225.0, 170.0, -135.0],  # Left eye left corner
            [225.0, 170.0, -135.0],   # Right eye right corner
            [-150.0, -150.0, -125.0], # Left mouth corner
            [150.0, -150.0, -125.0],  # Right mouth corner
        ], dtype=np.float64)

        image_points = []
        for idx in KEY_POINTS:
            lm = landmarks[idx]
            image_points.append([lm.x * w, lm.y * h])
        image_points = np.array(image_points, dtype=np.float64)

        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        dist_coeffs = np.zeros((4, 1))

        success, rotation_vector, _ = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return 0.0, 0.0, 0.0

        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rotation_matrix)
        yaw = angles[1] * 360
        pitch = angles[0] * 360
        roll = angles[2] * 360

        return yaw, pitch, roll

    def _angles_to_direction(self, yaw: float, pitch: float) -> str:
        """Map yaw/pitch angles to gaze direction string."""
        if abs(yaw) < YAW_THRESHOLD and abs(pitch) < PITCH_THRESHOLD:
            return "forward"
        if yaw < -YAW_THRESHOLD:
            return "left"
        if yaw > YAW_THRESHOLD:
            return "right"
        if pitch < -PITCH_THRESHOLD:
            return "up"
        return "down"

    def _heuristic_attention(self, person_bbox: Tuple) -> HeadPoseResult:
        """
        Fallback: use body position as proxy for attention direction.
        This is a very rough heuristic — MediaPipe is strongly preferred.
        """
        cx = (person_bbox[0] + person_bbox[2]) / 2
        if cx < 0.33:
            direction = "left"
        elif cx > 0.67:
            direction = "right"
        else:
            direction = "forward"

        return HeadPoseResult(
            detected=True,
            gaze_direction=direction,
            confidence=0.25,  # Low confidence for heuristic
            is_estimated=True
        )

    def is_attending_to_roi(
        self,
        head_pose: HeadPoseResult,
        roi: Dict[str, float],
        person_bbox: Tuple
    ) -> Tuple[bool, float]:
        """
        Determine if a person is attending to a region of interest.
        
        Args:
            head_pose: HeadPoseResult from estimate_head_pose
            roi: {"x1": 0.1, "y1": 0.2, "x2": 0.5, "y2": 0.4} — normalized ROI
            person_bbox: Person bounding box (normalized)
            
        Returns:
            (is_attending: bool, confidence: float)
        """
        if not head_pose.detected:
            return False, 0.0

        # 1. Check proximity: person must be near the ROI
        person_cx = (person_bbox[0] + person_bbox[2]) / 2
        roi_cx = (roi.get("x1", 0) + roi.get("x2", 1)) / 2
        roi_cy = (roi.get("y1", 0) + roi.get("y2", 1)) / 2
        person_cy = (person_bbox[1] + person_bbox[3]) / 2

        proximity = ((person_cx - roi_cx) ** 2 + (person_cy - roi_cy) ** 2) ** 0.5
        if proximity > 0.6:  # Too far from ROI
            return False, 0.0

        # 2. Check gaze direction toward ROI
        direction = head_pose.gaze_direction
        roi_is_left = roi_cx < person_cx - 0.1
        roi_is_right = roi_cx > person_cx + 0.1

        gaze_aligned = False
        if direction == "forward":
            gaze_aligned = True
        elif direction == "left" and roi_is_left:
            gaze_aligned = True
        elif direction == "right" and roi_is_right:
            gaze_aligned = True

        confidence = head_pose.confidence * (1.0 - min(proximity, 0.5))
        return gaze_aligned, confidence

    def close(self):
        """Release MediaPipe resources."""
        if self._face_mesh:
            self._face_mesh.close()


# Singleton
_estimator_instance: Optional[HeadPoseAttentionEstimator] = None


def get_attention_estimator() -> HeadPoseAttentionEstimator:
    global _estimator_instance
    if _estimator_instance is None:
        _estimator_instance = HeadPoseAttentionEstimator()
    return _estimator_instance
