import cv2
import numpy as np


class HeadPoseEstimator:

    def estimate(self, image_points, size):
        model_points = np.array([
            (0.0, 0.0, 0.0),
            (0.0, -330.0, -65.0),
            (-225.0, 170.0, -135.0),
            (225.0, 170.0, -135.0),
        ], dtype="double")

        focal = size[1]
        camera_matrix = np.array(
            [
                [focal, 0, size[1] / 2],
                [0, focal, size[0] / 2],
                [0, 0, 1],
            ],
            dtype="double",
        )

        dist = np.zeros((4, 1))
        success, rvec, tvec = cv2.solvePnP(
            model_points,
            image_points,
            camera_matrix,
            dist,
            flags=cv2.SOLVEPNP_ITERATIVE,
        )

        if not success:
            return np.array([0.0, 0.0, 0.0], dtype="double")

        rotation, _ = cv2.Rodrigues(rvec)
        pose = cv2.hconcat((rotation, tvec))
        _, _, _, _, _, _, angles = cv2.decomposeProjectionMatrix(pose)
        return angles
