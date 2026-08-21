import mediapipe as mp


mp_face = mp.solutions.face_mesh

face_mesh = mp_face.FaceMesh(
    static_image_mode=False,
    max_num_faces=5,
    refine_landmarks=True,
)
