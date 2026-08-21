from datetime import datetime

from app.services.analytics_service import save_interaction

import cv2
import time
from ultralytics import YOLO

# ==========================================
# Load YOLO Model
# ==========================================
model = YOLO("yolov8n.pt")

# ==========================================
# Shelf ROI Coordinates
# Format:
# "Shelf Name": (x1, y1, x2, y2)
# ==========================================
SHELVES = {
    "Shelf A": (40, 60, 250, 260),
    "Shelf B": (330, 60, 600, 260)
}

# ==========================================
# Open Webcam
# Change to "videos/retail.mp4" for video
# ==========================================
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("Unable to open video source.")
    exit()

# ==========================================
# Dictionaries
# ==========================================

# Stores entry time (seconds)
entry_time = {}

# Stores actual entry datetime
entry_datetime = {}

# Stores current shelf of each customer
current_shelf = {}

print("\nConsumer Attention System Started")
print("Press Q to Exit\n")

# ==========================================
# Main Loop
# ==========================================

while True:

    ret, frame = cap.read()

    if not ret:
        break

    # ======================================
    # Detect + Track Persons
    # ======================================

    results = model.track(
        frame,
        persist=True,
        classes=[0],
        verbose=False
    )

    # ======================================
    # Draw Shelf ROIs
    # ======================================

    for shelf_name, (sx1, sy1, sx2, sy2) in SHELVES.items():

        cv2.rectangle(
            frame,
            (sx1, sy1),
            (sx2, sy2),
            (0, 255, 0),
            2
        )

        cv2.putText(
            frame,
            shelf_name,
            (sx1, sy1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )

    boxes = results[0].boxes

    # Track IDs seen in this frame
    active_ids = set()

    if boxes is not None:

        for box in boxes:

            # ----------------------------
            # Bounding Box
            # ----------------------------
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            # ----------------------------
            # Tracking ID
            # ----------------------------
            if box.id is None:
                continue

            track_id = int(box.id.item())
            active_ids.add(track_id)

            # ----------------------------
            # Center Point
            # ----------------------------
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            # ----------------------------
            # Draw Person
            # ----------------------------
            cv2.rectangle(
                frame,
                (x1, y1),
                (x2, y2),
                (255, 0, 0),
                2
            )

            cv2.circle(
                frame,
                (center_x, center_y),
                5,
                (0, 0, 255),
                -1
            )

            cv2.putText(
                frame,
                f"ID {track_id}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 0),
                2
            )

            # ----------------------------
            # Check Shelf Interaction
            # ----------------------------
            person_inside = False

            for shelf_name, (sx1, sy1, sx2, sy2) in SHELVES.items():

                if sx1 <= center_x <= sx2 and sy1 <= center_y <= sy2:

                    person_inside = True

                    # First time entering shelf
                    if track_id not in entry_time:

                        entry_time[track_id] = time.time()
                        entry_datetime[track_id] = datetime.now()
                        current_shelf[track_id] = shelf_name

                        print(
                            f"Customer {track_id} ENTERED {shelf_name}"
                        )

                    # Calculate dwell time
                    dwell = time.time() - entry_time[track_id]

                    # Highlight Shelf
                    cv2.rectangle(
                        frame,
                        (sx1, sy1),
                        (sx2, sy2),
                        (0, 0, 255),
                        3
                    )

                    # Display Shelf Name
                    cv2.putText(
                        frame,
                        shelf_name,
                        (sx1, sy1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.7,
                        (0, 0, 255),
                        2
                    )

                    # Display Dwell Time
                    cv2.putText(
                        frame,
                        f"Dwell: {dwell:.1f}s",
                        (x1, y2 + 25),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (0, 255, 255),
                        2
                    )

                    break

            # ----------------------------
            # Customer Left Shelf
            # ----------------------------
            if not person_inside:

                if track_id in entry_time:

                    total = time.time() - entry_time[track_id]

                    print(
                        f"Customer {track_id} LEFT {current_shelf[track_id]}"
                    )
                    print(
                        f"Total Dwell Time : {total:.2f} Seconds\n"
                    )

                    save_interaction(
                        customer_id=track_id,
                        shelf_name=current_shelf[track_id],
                        entry_time=entry_datetime[track_id],
                        exit_time=datetime.now(),
                        dwell_time=total,
                    )

                    del entry_time[track_id]
                    del entry_datetime[track_id]
                    del current_shelf[track_id]

    # ======================================
    # Remove Customers Who Left Camera View
    # ======================================

    disappeared = list(entry_time.keys())

    for pid in disappeared:

        if pid not in active_ids:

            total = time.time() - entry_time[pid]

            print(
                f"Customer {pid} LEFT CAMERA"
            )

            print(
                f"Total Dwell Time : {total:.2f} Seconds\n"
            )

            save_interaction(
                customer_id=pid,
                shelf_name=current_shelf[pid],
                entry_time=entry_datetime[pid],
                exit_time=datetime.now(),
                dwell_time=total,
            )

            del entry_time[pid]
            del entry_datetime[pid]
            del current_shelf[pid]

    # ======================================
    # Show Video
    # ======================================

    cv2.imshow(
        "Consumer Attention System - Dwell Time",
        frame
    )

    # Press Q to Exit
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# ==========================================
# Cleanup
# ==========================================

cap.release()
cv2.destroyAllWindows()