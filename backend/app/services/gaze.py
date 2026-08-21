import os
import cv2

# Point directly to the local XML file in backend/app/services/
cascade_path = os.path.join(os.path.dirname(__file__), "haarcascade_frontalface_default.xml")

if not os.path.exists(cascade_path):
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"

face_cascade = cv2.CascadeClassifier(cascade_path)

def estimate_gaze_direction(frame, xyxy_bbox):
    """
    Crops upper head region from shopper bounding box to estimate gaze/head orientation.
    Returns: 'Facing Shelf' or 'Facing Away'
    """
    if face_cascade.empty():
        return "Facing Shelf"

    x1, y1, x2, y2 = map(int, xyxy_bbox)
    
    # Crop top 35% of bounding box (head region)
    head_h = max(10, int((y2 - y1) * 0.35))
    head_crop = frame[max(0, y1):max(0, y1 + head_h), max(0, x1):max(0, x2)]
    
    if head_crop.size == 0:
        return "Facing Away"

    gray_head = cv2.cvtColor(head_crop, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray_head, scaleFactor=1.1, minNeighbors=3, minSize=(20, 20))

    return "Facing Shelf" if len(faces) > 0 else "Facing Away"