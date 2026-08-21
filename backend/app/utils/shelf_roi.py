import cv2

# ---------------------------------
# Shelf ROI Coordinates
# Format:
# Shelf Name : (x1, y1, x2, y2)
# ---------------------------------

SHELVES = {
    "Shelf A": (40, 60, 250, 260),
    "Shelf B": (330, 60, 600, 260)
}

# Webcam
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Unable to open webcam.")
    exit()

print("Shelf ROI started...")

while True:

    ret, frame = cap.read()

    if not ret:
        break

    # Draw Shelf Boxes
    for shelf_name, (x1, y1, x2, y2) in SHELVES.items():

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0,255,0),
            2
        )

        cv2.putText(
            frame,
            shelf_name,
            (x1,y1-10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0,255,0),
            2
        )

    cv2.imshow("Shelf ROI", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

cap.release()
cv2.destroyAllWindows()