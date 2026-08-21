import cv2
from app.gaze.face_analyzer import FaceAnalyzer

# ------------------------------------
# Initialize Face Analyzer
# ------------------------------------

face_analyzer = FaceAnalyzer()

cap = cv2.VideoCapture(0)

if not cap.isOpened():
    raise RuntimeError("Cannot open webcam")

print("=" * 60)
print("Press Q to Exit")
print("=" * 60)

while True:

    ret, frame = cap.read()

    if not ret:
        break

    h, w = frame.shape[:2]

    # -------------------------------------------------
    # Entire frame is treated as person crop for testing
    # -------------------------------------------------

    person_bbox = (0, 0, w, h)

    analysis = face_analyzer.analyze(
        frame,
        person_bbox
    )

    if analysis is not None:

        x1, y1, x2, y2 = analysis["face_bbox"]

        cv2.rectangle(
            frame,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            2
        )

        print("-" * 50)
        print("Face Detected")

        print(
            "Confidence:",
            round(
                analysis["score"],
                3
            )
        )

        if analysis["landmarks_2d"] is not None:

            print(
                "2D Landmarks:",
                len(
                    analysis["landmarks_2d"]
                )
            )

            for p in analysis["landmarks_2d"]:

                px = int(p[0]) + x1
                py = int(p[1]) + y1

                cv2.circle(
                    frame,
                    (px, py),
                    1,
                    (0,255,255),
                    -1
                )

        if analysis["landmarks_3d"] is not None:

            print(
                "3D Landmarks:",
                len(
                    analysis["landmarks_3d"]
                )
            )

        if analysis["gender"] is not None:

            gender = (
                "Male"
                if analysis["gender"] == 1
                else "Female"
            )

            cv2.putText(
                frame,
                gender,
                (x1, y1-40),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255,255,0),
                2
            )

        if analysis["age"] is not None:

            cv2.putText(
                frame,
                f"Age:{analysis['age']}",
                (x1, y1-15),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255,255,0),
                2
            )

    cv2.imshow(
        "InsightFace Test",
        frame
    )

    key = cv2.waitKey(1)

    if key == ord("q"):
        break

cap.release()

cv2.destroyAllWindows()