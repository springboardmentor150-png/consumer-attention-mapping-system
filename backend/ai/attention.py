import cv2

# Load OpenCV Haar Cascade
face_detector = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)

def estimate_head_direction(person_crop):
    """
    Estimate rough head direction.

    Returns:
        LEFT
        CENTER
        RIGHT
        NO_FACE
    """

    gray = cv2.cvtColor(person_crop, cv2.COLOR_BGR2GRAY)

    faces = face_detector.detectMultiScale(
        gray,
        scaleFactor=1.2,
        minNeighbors=5
    )

    if len(faces) == 0:
        return "NO_FACE"

    x, y, w, h = faces[0]

    face_center = x + w // 2
    image_center = person_crop.shape[1] // 2

    if face_center < image_center - 40:
        return "LEFT"

    elif face_center > image_center + 40:
        return "RIGHT"

    else:
        return "CENTER"