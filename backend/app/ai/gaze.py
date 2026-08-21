from __future__ import annotations

from typing import Optional

import cv2
import mediapipe as mp


mp_face = mp.solutions.face_mesh

face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=5,
    refine_landmarks=True,
)


def detect_face(frame):
    """Run MediaPipe Face Mesh on a shopper crop."""
    if frame is None or frame.size == 0:
        return None

    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    return face_mesh.process(rgb)


def estimate_head_direction(results) -> Optional[str]:
    """Return a coarse left/center/right head direction for the first face."""
    if results is None or not results.multi_face_landmarks:
        return None

    landmarks = results.multi_face_landmarks[0].landmark
    nose_x = landmarks[1].x
    left_eye_x = landmarks[33].x
    right_eye_x = landmarks[263].x
    eye_midpoint = (left_eye_x + right_eye_x) / 2

    # A small tolerance prevents normal landmark jitter from changing the
    # direction label on every frame.
    if nose_x < eye_midpoint - 0.03:
        return "Left"
    if nose_x > eye_midpoint + 0.03:
        return "Right"
    return "Center"


def direction_to_shelf(direction: str) -> str:
    """Map the coarse head direction to the shelf layout."""
    if direction == "Left":
        return "Shelf A"
    if direction == "Center":
        return "Shelf B"
    return "Shelf C"
