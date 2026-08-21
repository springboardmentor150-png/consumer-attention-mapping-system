"""
head_pose.py

Head Pose Estimation using InsightFace 5 facial keypoints
"""

import cv2
import numpy as np


class HeadPoseEstimator:

    def __init__(self):

        # 3D face model points (approximate)
        self.model_points = np.array([
            (0.0, 0.0, 0.0),          # Nose
            (-30.0, -30.0, -30.0),    # Left Eye
            (30.0, -30.0, -30.0),     # Right Eye
            (-25.0, 30.0, -30.0),     # Left Mouth
            (25.0, 30.0, -30.0)       # Right Mouth
        ], dtype=np.float64)

    def estimate_pose(self, keypoints, image_shape):
        """
        Estimate head pose from InsightFace 5 facial keypoints.

        Parameters
        ----------
        keypoints : ndarray (5,2)
            InsightFace face.kps

        image_shape : tuple
            face_crop.shape

        Returns
        -------
        yaw, pitch, roll
        """

        # ------------------------------
        # Validate input
        # ------------------------------

        if keypoints is None:
            return 0.0, 0.0, 0.0

        keypoints = np.asarray(keypoints, dtype=np.float64)

        if keypoints.shape != (5, 2):
            return 0.0, 0.0, 0.0

        # InsightFace keypoint order:
        # 0 Left Eye
        # 1 Right Eye
        # 2 Nose
        # 3 Left Mouth
        # 4 Right Mouth

        image_points = np.array([
            keypoints[2],   # Nose
            keypoints[0],   # Left Eye
            keypoints[1],   # Right Eye
            keypoints[3],   # Left Mouth
            keypoints[4]    # Right Mouth
        ], dtype=np.float64)

        h, w = image_shape[:2]

        focal_length = float(w)

        center = (
            w / 2.0,
            h / 2.0
        )

        camera_matrix = np.array([
            [focal_length, 0.0, center[0]],
            [0.0, focal_length, center[1]],
            [0.0, 0.0, 1.0]
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1), dtype=np.float64)

        success, rvec, tvec = cv2.solvePnP(
            self.model_points,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_EPNP
        )

        if not success:
            return 0.0, 0.0, 0.0

        rotation_matrix, _ = cv2.Rodrigues(rvec)

        projection_matrix = np.hstack(
            (rotation_matrix, tvec)
        )

        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(
            projection_matrix
        )

        # Convert to 1D float array
        euler_angles = np.asarray(
            euler_angles,
            dtype=np.float64
        ).flatten()

        if euler_angles.size < 3:
            return 0.0, 0.0, 0.0

        pitch = float(euler_angles[0])
        yaw = float(euler_angles[1])
        roll = float(euler_angles[2])

        return yaw, pitch, roll