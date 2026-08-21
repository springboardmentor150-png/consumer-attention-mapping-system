import cv2

# Open the default webcam (0)
cap = cv2.VideoCapture(0)

# Check if the camera opened successfully
if not cap.isOpened():
    print("Error: Could not open camera.")
    exit()

print("Camera started successfully.")
print("Press 'Q' to quit.")

while True:
    # Read a frame
    ret, frame = cap.read()

    if not ret:
        print("Failed to grab frame.")
        break

    # Display the frame
    cv2.imshow("Camera Feed Verification", frame)

    # Exit when 'Q' is pressed
    if cv2.waitKey(1) & 0xFF == ord('q'):
        print("Closing camera...")
        break

# Release resources
cap.release()
cv2.destroyAllWindows()