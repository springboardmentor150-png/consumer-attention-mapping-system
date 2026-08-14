import cv2
import math
from ultralytics import YOLO
from datetime import datetime


from database import SessionLocal
from models import AttentionRecord, ShopperSession


from tracking.dwell_time import (
    SHELF_ZONE,
    get_shelf_zone,
    update_dwell_time
)
from tracking.heatmap import add_heatmap_point, generate_heatmap
from tracking.head_pose import (
    detect_face,
    estimate_head_pose,
    get_head_angles,
    get_gaze_endpoint,
    is_looking_at_shelf
)
# Load pretrained YOLOv8 model
model = YOLO("yolov8n.pt")

# Map ByteTrack IDs to clean shopper IDs
shopper_id_map = {}
next_shopper_id = 1
frame_count = 0
db = SessionLocal()

attention_start_times = {}
not_looking_frames = {}

shopper_entry_times = {}
shopper_last_positions = {}
shopper_path_lengths = {}
completed_shoppers = set()
# Path to retail test video
video_path = "test_videos/retail_test.mp4"

# Open video
cap = cv2.VideoCapture(video_path)
last_frame = None

# Get original video properties
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS)
print(f"Video Width : {width}")
print(f"Video Height: {height}")

# Create output video writer
fourcc = cv2.VideoWriter_fourcc(*"mp4v")

out = cv2.VideoWriter(
    "tracked_output.mp4",
    fourcc,
    fps,
    (width, height)
)

while cap.isOpened():
    success, frame = cap.read()
    if success:
        last_frame = frame.copy()

    if not success:
        break
    frame_count += 1

    # Detect only persons (COCO class 0)
    results = model.track(
    frame,
    persist=True,
    classes=[0],
    tracker="tracking/custom_bytetrack.yaml",
    verbose=False
)

    #Draw bounding boxes
    #Copy original frame
    annotated_frame = frame.copy()

    #Get shelf zone coordinates
    zone_x1, zone_y1, zone_x2, zone_y2 = get_shelf_zone()

    cv2.rectangle(
        annotated_frame,
        (zone_x1, zone_y1),
        (zone_x2, zone_y2),
        (255, 0, 0),
        3
)

    cv2.putText(
        annotated_frame,
        "Shelf Zone",
        (zone_x1, max(zone_y1 - 10, 30)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 0, 0),
        2
)

    result = results[0]
    # Check whether tracking IDs exist
    if result.boxes is not None and result.boxes.id is not None:
        boxes = result.boxes.xyxy.cpu().numpy()
        track_ids = result.boxes.id.int().cpu().tolist()

    for box, track_id in zip(boxes, track_ids):
        x1, y1, x2, y2 = map(int, box)
        # Crop the upper half of the person's bounding box (face/head region)
        face_crop = frame[
            y1 : y1 + (y2 - y1) // 2,
            x1 : x2
    ]
    face_landmarks = detect_face(face_crop)

    pitch = yaw = roll = 0.0
    head_direction = "Unknown"
    looking_at_shelf = False
    attention_status = "No Face"
    color = (0, 0, 255)
    rotation_vector = None

    if face_landmarks is not None:

        rotation_vector, translation_vector = estimate_head_pose(
            face_landmarks,
            frame.shape[1],
            frame.shape[0]
    )

        if rotation_vector is not None:

            pitch, yaw, roll = get_head_angles(rotation_vector)
            nose = face_landmarks.landmark[1]

            nose_x = int(
                x1 + nose.x * (x2 - x1)
            )

            nose_y = int(
                y1 + nose.y * ((y2 - y1) // 2)
)

            end_x, end_y = get_gaze_endpoint(
                nose_x,
                nose_y,
                yaw,
                pitch
)
            shopper_center_x = (x1 + x2) / 2

            looking_at_shelf = is_looking_at_shelf(
                yaw,
                shopper_center_x,
                SHELF_ZONE
)
            if looking_at_shelf:
                attention_status = "Looking at Shelf"
                color = (0, 255, 0)
            else:
                attention_status = "Not Looking"
                color = (0, 0, 255)
            

            if yaw < -15:
                head_direction = "Left"
            elif yaw > 15:
                head_direction = "Right"
            else:
                head_direction = "Center"

            print(
                f"Pitch:{pitch:.2f} "
                f"Yaw:{yaw:.2f} "
                f"Roll:{roll:.2f}"
)
    else:
        print("❌ Face not detected")


    # Draw bounding box
    cv2.rectangle(
        annotated_frame,
        (x1, y1),
        (x2, y2),
        (0, 255, 0),
        2
    )

    # Assign clean shopper ID
    if track_id not in shopper_id_map:
        shopper_id_map[track_id] = next_shopper_id
        next_shopper_id += 1

    clean_id = shopper_id_map[track_id]
    
    # Shopper center coordinates
    center_x = (x1 + x2) / 2
    center_y = (y1 + y2) / 2 
    
    
    # Store point for heatmap generation
    add_heatmap_point(
        int(center_x),
        int(center_y)
)

    # Save entry time only once
    if clean_id not in shopper_entry_times:
        shopper_entry_times[clean_id] = datetime.now()

    # Initialize path length
    if clean_id not in shopper_path_lengths:
        shopper_path_lengths[clean_id] = 0.0

    # Calculate distance traveled
    if clean_id in shopper_last_positions:
        last_x, last_y = shopper_last_positions[clean_id]

        distance = math.sqrt(
            (center_x - last_x) ** 2 +
            (center_y - last_y) ** 2
    )

        shopper_path_lengths[clean_id] += distance

    # Update latest position
    shopper_last_positions[clean_id] = (center_x, center_y)
    
    # Update dwell time
    update_dwell_time(
        clean_id,
        (x1, y1, x2, y2)
)

    

    # Current timestamp for this frame
    current_time = frame_count / fps

    label = (
        f"Shopper #{clean_id} | "
        f"{head_direction}"
)

    print(f"Tracking Shopper #{clean_id}")

    direction_color = (0, 255, 255)
    cv2.putText(
        annotated_frame,
        f"Looking: {head_direction}",
        (x1, y2 + 20),
        cv2.FONT_HERSHEY_SIMPLEX,
         0.6,
        direction_color,
        2
    )

    cv2.putText(
        annotated_frame,
        f"P:{pitch:.1f}  Y:{yaw:.1f}  R:{roll:.1f}",
        (x1, y2 + 45),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.55,
        (0, 255, 255),
        2
)
    if looking_at_shelf:

        attention_status = "Looking at Shelf"
        color = (0, 255, 0)

        # Reset counter
        not_looking_frames[clean_id] = 0

        # Start timer only once
        if clean_id not in attention_start_times:
            attention_start_times[clean_id] = current_time

    else:

        attention_status = "Not Looking"
        color = (0, 0, 255)

        # Increase consecutive "not looking" frames
        not_looking_frames[clean_id] = (
            not_looking_frames.get(clean_id, 0) + 1
    )

        # End attention only after 5 consecutive frames
        if (
            not_looking_frames[clean_id] >= 5
            and clean_id in attention_start_times
    ):

            start_time = attention_start_times.pop(clean_id)

            duration = current_time - start_time

            if duration >= 0.5:

                attention_record = AttentionRecord(
                    shopper_id=clean_id,
                    shelf_id="Shelf Zone",
                    attention_start_time=start_time,
                    attention_end_time=current_time,
                    total_attention_duration=duration,
                    attention_percentage=0.0
            )

                db.add(attention_record)
                db.commit()

            print(
                f"Saved Attention: Shopper #{clean_id}"
                f" | {duration:.2f} sec"
            )
    cv2.putText(
        annotated_frame,
        attention_status,
        (x1, y2 + 70),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6,
        color,
        2
)
    if face_landmarks is not None and rotation_vector is not None:
        cv2.arrowedLine(
            annotated_frame,
            (nose_x, nose_y),
            (end_x, end_y),
            (0, 0, 255),
            3,
            tipLength=0.3
    )
       

    cv2.putText(
        annotated_frame,
        label,
        (x1, max(y1 - 10, 20)),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (0, 255, 0),
        2
        )
    
    # Display frame number
    cv2.putText(
        annotated_frame,
        f"Frame: {frame_count}",
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 255, 0),
        2
)
    # Save tracked frame to output video
    out.write(annotated_frame)



    # Resize only for display
    display_frame = cv2.resize(
    annotated_frame,
    (960, 540)
)

    cv2.imshow("Person Detection", display_frame)

    # Press Q to stop
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break
db.close()
cap.release()
out.release()

# Generate final heatmap
if last_frame is not None:
    generate_heatmap(last_frame, "heatmap.png")
    print("Heatmap saved as heatmap.png")
cv2.destroyAllWindows()

print("Tracked output video saved successfully!")