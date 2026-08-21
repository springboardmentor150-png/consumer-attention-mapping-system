import cv2
import mediapipe as mp      #for face mesh
import numpy as np          #for matrix operations

class GazeEstimator:

    def __init__(self):

        self.mp_face_mesh = mp.solutions.face_mesh

        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

        self.drawer = mp.solutions.drawing_utils

        self.drawing_spec = self.drawer.DrawingSpec(    #mesh colour and str
            color=(0, 255, 0),
            thickness=1,
            circle_radius=1,
        )

        self.model_points = np.array([
            (0.0, 0.0, 0.0),          # Nose
            (0.0, -63.6, -12.5),      # Chin
            (-43.3, 32.7, -26.0),     # Left Eye
            (43.3, 32.7, -26.0),      # Right Eye
            (-28.9, -28.9, -24.1),    # Left Mouth
            (28.9, -28.9, -24.1),     # Right Mouth
        ], dtype=np.float64)

    def process(self, person_crop):

        if person_crop is None or person_crop.size == 0:

            return {
                "face_found": False,
                "landmarks": None,
            }

        rgb = cv2.cvtColor(person_crop, cv2.COLOR_BGR2RGB)

        results = self.face_mesh.process(rgb)   #mediapipe predicts the landmarks here

        if not results.multi_face_landmarks:

            return {
                "face_found": False,
                "landmarks": None,
            }

        face_landmarks = results.multi_face_landmarks[0]
        height, width = person_crop.shape[:2]

        landmark_indices = [1, 152, 33, 263, 61, 291]   #positions of nose,chin,le,re,lm,rm for head pose estimatn

        image_points = []

        for idx in landmark_indices:

            landmark = face_landmarks.landmark[idx]

            x = int(landmark.x * width)     #conv to pixels
            y = int(landmark.y * height)

            image_points.append((x, y))

        image_points = np.array(image_points, dtype=np.float64) 
        height, width = person_crop.shape[:2]

        focal_length = width

        camera_matrix = np.array([
            [focal_length, 0, width / 2],
            [0, focal_length, height / 2],
            [0, 0, 1]
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1))

        # print("\n========== Head Pose Debug ==========")
        # print("Model Points Shape:", self.model_points.shape)
        # print("Image Points Shape:", image_points.shape)
        # print(image_points)


        success, rotation_vector, translation_vector = cv2.solvePnP(
            self.model_points,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)

        projection_matrix = np.hstack((rotation_matrix, translation_vector))

        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(
            projection_matrix
        )

        pitch = float(euler_angles[0])
        yaw = float(euler_angles[1])
        roll = float(euler_angles[2])
        direction = self.get_direction(yaw)

        # print("\n========== Head Pose ==========")
        # print(f"Yaw   : {yaw:.2f}")
        # print(f"Pitch : {pitch:.2f}")
        # print(f"Roll  : {roll:.2f}")
        # print(f"Direction : {direction}")
        # print("===============================\n")


        return {
            "face_found": True,
            "landmarks": face_landmarks,
            "image_points": image_points,
            "rotation_vector": rotation_vector,
            "translation_vector": translation_vector,
            "yaw": yaw,
            "pitch": pitch,
            "roll": roll,
            "direction": direction,
        }

    def draw_landmarks(self, frame, face_landmarks):

        self.drawer.draw_landmarks(
            image=frame,
            landmark_list=face_landmarks,
            connections=self.mp_face_mesh.FACEMESH_TESSELATION,
            landmark_drawing_spec=self.drawing_spec,
            connection_drawing_spec=self.drawing_spec,
        )

    def draw_keypoints(self, frame, image_points):

        for x, y in image_points:

            cv2.circle(
                frame,
                (int(x), int(y)),
                4,
                (0, 0, 255),
                -1
            )

    def get_direction(self, yaw):

        if yaw < -15:
            return "RIGHT"

        elif yaw > 15:
            return "LEFT"

        return "CENTER"