import numpy as np

LEFT_EYE = [33, 133]
RIGHT_EYE = [362, 263]
NOSE = 1
CHIN = 152


def landmark_to_pixel(landmark, w, h):
    return np.array([
        int(landmark.x * w),
        int(landmark.y * h),
    ], dtype="double")
