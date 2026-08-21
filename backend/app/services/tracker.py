import cv2
from ultralytics import YOLO
from app.services.head_pose import HeadPoseEstimator
from app.services.shelf_mapper import ShelfMapper
from app.services.dwell_time import DwellTimeTracker
from app.services.attention_tracker import AttentionTracker
from app.services.analytics_service import AnalyticsService
from app.services.reid import ReIDManager
from app.services.heatmap_tracker import HeatmapTracker
from app.services.heatmap_generator import HeatmapGenerator
from app.services.product_tracker import ProductTracker

model = YOLO("yolov8n.pt")
product_model = YOLO("app/models/trained_models/best.pt")
print(product_model.names)
dwell_tracker = DwellTimeTracker()
head_pose = HeadPoseEstimator()
shelf_mapper = ShelfMapper()
attention_tracker = AttentionTracker()
analytics = AnalyticsService()
reid = ReIDManager(similarity_threshold=0.78)
heatmap_tracker = HeatmapTracker()
heatmap_generator = HeatmapGenerator()
product_tracker = ProductTracker()

video_path = "app/services/videos/shopping6.mp4"
cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Unable to open video.")
    exit()

previous_bytetrack_ids = set()

while True:
    ret, frame = cap.read()

    if not ret:
        break

    current_video_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

    frame = cv2.resize(frame, (900, 500))

    results = model.track(
        frame,
        persist=True,
        tracker="app/services/my_botsort.yaml",
        classes=[0],
        conf=0.30,
        iou=0.45,
        verbose=False,
    )

    annotated_frame = frame.copy()

    product_results = product_model(frame, conf=0.25, verbose=False)

    product_boxes = []

    for box in product_results[0].boxes:

        x1, y1, x2, y2 = map(int, box.xyxy[0])

        cls = int(box.cls[0])

        label = product_model.names[cls]

        product_boxes.append((x1, y1, x2, y2, label))

        cv2.rectangle(
            annotated_frame,
            (x1, y1),
            (x2, y2),
            (255, 0, 0),
            2,
        )

        cv2.putText(
            annotated_frame,
            label,
            (x1, y1 - 8),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (255, 0, 0),
            2,
        )

        products = product_tracker.update(product_boxes)

    # ----------------------------
    # Draw Shelf Zones
    # ----------------------------

    frame_width = annotated_frame.shape[1]
    frame_height = annotated_frame.shape[0]

    zone_width = frame_width // 3

    cv2.putText(
        annotated_frame,
        "ZONE A",
        (40, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 255),
        3,
    )

    cv2.putText(
        annotated_frame,
        "ZONE B",
        (zone_width + 40, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 255),
        3,
    )

    cv2.putText(
        annotated_frame,
        "ZONE C",
        (zone_width * 2 + 40, 35),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 255),
        3,
    )

    track_ids = set()
    current_bytetrack_ids = set()

    if results and results[0].boxes is not None and results[0].boxes.id is not None:

        boxes = results[0].boxes

        for i in range(len(boxes)):

            x1, y1, x2, y2 = map(int, boxes.xyxy[i].cpu().numpy())

            width = x2 - x1
            height = y2 - y1

            # ----------------------------
            # ByteTrack ID
            # ----------------------------

            bytetrack_id = int(boxes.id[i].cpu().item())

            current_bytetrack_ids.add(bytetrack_id)

            person_crop = frame[y1:y2, x1:x2]

            if person_crop.size == 0:
                continue

            track_id = reid.get_global_id(bytetrack_id, person_crop)

            track_ids.add(track_id)

            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2

            heatmap_tracker.update(track_id, center_x, center_y)

            # ----------------------------
            # Draw Bounding Box
            # ----------------------------

            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)

            dwell = dwell_tracker.dwell_times.get(track_id, 0)

            # ----------------------------
            # Head Pose
            # ----------------------------

            head_roi = frame[y1 : y1 + int((y2 - y1) * 0.4), x1:x2]

            direction = "DOWN"
            attention_zone = "None"

            if head_roi.size != 0:

                pitch, yaw, roll = head_pose.estimate(head_roi)
                if pitch is not None and yaw is not None:
                    print(f"ID {track_id} | Pitch: {pitch:.2f} | Yaw: {yaw:.2f}")

                direction = head_pose.get_direction(pitch, yaw)

                person_x = (x1 + x2) // 2

                current_zone = shelf_mapper.get_current_zone(person_x)

                attention_zone = shelf_mapper.get_attention_zone(
                    current_zone, direction
                )

                viewed_product = "None"

                if attention_zone != "None":

                    eye_x = (x1 + x2) // 2
                    eye_y = y1 + height // 4

                    nearest_distance = float("inf")

                    for px1, py1, px2, py2, label in product_boxes:

                        product_center_x = (px1 + px2) // 2
                        product_center_y = (py1 + py2) // 2

                        distance = (
                            (eye_x - product_center_x) ** 2
                            + (eye_y - product_center_y) ** 2
                        ) ** 0.5

                        if distance < nearest_distance:

                            nearest_distance = distance
                            viewed_product = label

                attention_tracker.update(track_id, attention_zone, current_video_time)

            # ----------------------------
            # Labels
            # ----------------------------

            cv2.putText(
                annotated_frame,
                f"ID {track_id}",
                (x1, y1 - 35),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (255, 255, 0),
                2,
            )

            cv2.putText(
                annotated_frame,
                f"{dwell:.1f} sec",
                (x1, y1 - 12),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
            )

            cv2.putText(
                annotated_frame,
                direction,
                (x1, y2 + 20),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 0, 255),
                2,
            )

            cv2.putText(
                annotated_frame,
                f"{attention_zone} | {viewed_product}",
                (x1, y2 + 45),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (255, 0, 255),
                2,
            )
    finished_sessions = dwell_tracker.update(track_ids, current_video_time)

    # Remove ReID mapping ONLY when shopper has actually exited
    for session in finished_sessions:
        reid.remove_global_id(session["track_id"])

    for session in finished_sessions:

        zone_times = attention_tracker.finish_session(session["track_id"])

        print("\n========== SHOPPER SESSION ==========")
        print(f"Shopper ID : {session['track_id']}")
        print(f"Dwell Time : {session['dwell_time']:.2f} sec")

        valid_zones = {}

        if zone_times:

            print("\nAttention Summary")

            for zone, seconds in zone_times.items():
                print(f"{zone} : {seconds:.2f} sec")

            valid_zones = {
                zone: seconds for zone, seconds in zone_times.items() if zone != "None"
            }

        if valid_zones:
            most_viewed = max(valid_zones, key=valid_zones.get)
        else:
            most_viewed = "No shelf viewed"

        print(f"\nMost Viewed : {most_viewed}")

        print("=====================================")

        analytics.save_session(
            shopper_id=session["track_id"],
            dwell_time=session["dwell_time"],
            zone_times=zone_times if zone_times else {},
        )

    cv2.imshow("Consumer Attention Mapping System", annotated_frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break


# ---------------------------------------
# Video finished
# Force remaining shoppers to exit
# ---------------------------------------

current_video_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0

finished_sessions = dwell_tracker.update([], current_video_time + 5)

for session in finished_sessions:

    zone_times = attention_tracker.finish_session(session["track_id"])

    print("\n========== SHOPPER SESSION ==========")
    print(f"Shopper ID : {session['track_id']}")
    print(f"Dwell Time : {session['dwell_time']:.2f} sec")

    if zone_times:

        print("\nAttention Summary")

        for zone, seconds in zone_times.items():
            print(f"{zone} : {seconds:.2f} sec")

        # Ignore "None" while selecting the most viewed shelf
        valid_zones = {
            zone: seconds for zone, seconds in zone_times.items() if zone != "None"
        }

        if valid_zones:
            most_viewed = max(valid_zones, key=valid_zones.get)
        else:
            most_viewed = "No shelf viewed"

        print(f"\nMost Viewed : {most_viewed}")

    print("=====================================")

    analytics.save_session(
        shopper_id=session["track_id"],
        dwell_time=session["dwell_time"],
        zone_times=zone_times if zone_times else {},
    )

cap.release()
points = heatmap_tracker.get_all_points()

if points:

    heatmap_generator.generate(frame, points)
cv2.destroyAllWindows()
