import cv2
import mediapipe as mp
import numpy as np
import math

mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
def detect_face(face_image):
    """
    Detect face landmarks in a cropped face image.
    Returns MediaPipe landmarks if a face is found.
    """

    if face_image is None or face_image.size == 0:
        return None

    rgb = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb)

    if results.multi_face_landmarks:
        return results.multi_face_landmarks[0]

    return None
def get_head_direction(face_landmarks):
    """
    Simple head direction estimation using nose position.
    Returns: Left, Right or Center.
    """

    nose = face_landmarks.landmark[1]

    if nose.x < 0.45:
        return "Left"

    elif nose.x > 0.55:
        return "Right"

    return "Center"
def get_face_landmark_points(face_landmarks):
    """
    Extract the facial landmarks required for Head Pose Estimation.
    """
    landmarks = face_landmarks.landmark

    image_points = np.array([
        (landmarks[1].x, landmarks[1].y),      # Nose tip
        (landmarks[152].x, landmarks[152].y),  # Chin
        (landmarks[33].x, landmarks[33].y),    # Left eye corner
        (landmarks[263].x, landmarks[263].y),  # Right eye corner
        (landmarks[61].x, landmarks[61].y),    # Left mouth corner
        (landmarks[291].x, landmarks[291].y)   # Right mouth corner
    ], dtype=np.float64)

    return image_points
def get_face_model_points():
    """
    Return the standard 3D facial model points.
    """

    model_points = np.array([
        (0.0, 0.0, 0.0),           # Nose tip
        (0.0, -330.0, -65.0),      # Chin
        (-225.0, 170.0, -135.0),   # Left eye corner
        (225.0, 170.0, -135.0),    # Right eye corner
        (-150.0, -150.0, -125.0),  # Left mouth corner
        (150.0, -150.0, -125.0)    # Right mouth corner
    ], dtype=np.float64)

    return model_points
def get_camera_matrix(frame_width, frame_height):
    """
    Create camera intrinsic matrix.
    """

    focal_length = frame_width

    center = (
        frame_width / 2,
        frame_height / 2
    )

    camera_matrix = np.array([
        [focal_length, 0, center[0]],
        [0, focal_length, center[1]],
        [0, 0, 1]
    ], dtype=np.float64)

    return camera_matrix
def get_distortion_coefficients():
    """
    Assume no lens distortion.
    """

    return np.zeros((4, 1), dtype=np.float64)
def estimate_head_pose(face_landmarks, frame_width, frame_height):
    """
    Estimate head pose using solvePnP().
    """
    image_points = get_face_landmark_points(face_landmarks)

    image_points[:, 0] *= frame_width
    image_points[:, 1] *= frame_height

    model_points = get_face_model_points()

    camera_matrix = get_camera_matrix(
        frame_width,
        frame_height
    )

    dist_coeffs = get_distortion_coefficients()

    success, rotation_vector, translation_vector = cv2.solvePnP(
        model_points,
        image_points,
        camera_matrix,
        dist_coeffs,
        flags=cv2.SOLVEPNP_ITERATIVE
    )

    if not success:
        return None, None

    return rotation_vector, translation_vector
def get_head_angles(rotation_vector):
    """
    Convert rotation vector into Pitch, Yaw and Roll.
    """

    rotation_matrix, _ = cv2.Rodrigues(rotation_vector)

    projection_matrix = np.hstack(
        (rotation_matrix, np.zeros((3, 1)))
    )

    _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(
        projection_matrix
    )

    pitch = float(euler_angles[0][0])
    yaw = float(euler_angles[1][0])
    roll = float(euler_angles[2][0])

    # Normalize angles to [-180, 180]
    pitch = (pitch + 180) % 360 - 180
    yaw = (yaw + 180) % 360 - 180
    roll = (roll + 180) % 360 - 180

    return pitch, yaw, roll
def get_gaze_endpoint(nose_x, nose_y, yaw, pitch, length=120):
    """
    Calculate the end point of the head direction arrow.
    """

    yaw_rad = math.radians(yaw)
    pitch_rad = math.radians(pitch)

    end_x = int(
        nose_x + length * math.sin(yaw_rad)
    )

    end_y = int(
        nose_y - length * math.sin(pitch_rad)
    )

    return end_x, end_y
def gaze_intersects_shelf(end_x, end_y, shelf_zone):
    """
    Check whether the gaze arrow endpoint lies inside the shelf region.
    """

    x1, y1, x2, y2 = shelf_zone

    return x1 <= end_x <= x2 and y1 <= end_y <= y2
def is_looking_at_shelf(yaw, shopper_center_x, shelf_zone):
    """
    Determine whether the shopper is looking towards the shelf.

    Assumption:
    - Shelf is on the right side of the frame.
    - Positive yaw = looking right.
    - Negative yaw = looking left.
    """

    shelf_center_x = (shelf_zone[0] + shelf_zone[2]) / 2

    # Shopper is left of the shelf
    if shopper_center_x < shelf_center_x:
        return yaw > 15

    # Shopper is right of the shelf
    else:
        return yaw < -15