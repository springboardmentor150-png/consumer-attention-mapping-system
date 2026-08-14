import cv2


camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Error: Could not open camera")
    exit()

print("Camera opened successfully")
print("Press 'q' to close the camera")


while True:
    success, frame = camera.read()

    if not success:
        print("Error: Could not read frame")
        break

    cv2.imshow("Camera Feed Verification", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


camera.release()
cv2.destroyAllWindows()

print("Camera closed successfully")