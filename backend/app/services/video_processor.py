"""
video_processor.py

Consumer Attention System
Milestone 2

Features
--------
✓ YOLOv8 Person Detection
✓ ByteTrack Tracking
✓ Tracking Database Storage
✓ Dwell Time Tracking
✓ Shelf Zone Detection
✓ Face Detection (InsightFace)
✓ Head Pose Estimation
✓ Gaze Estimation
✓ Attention Analysis
"""

import cv2
import traceback
import time

# ----------------------------
# Detection & Tracking
# ----------------------------

from app.services.detector import detector
from app.services.tracker import tracker
from app.services.dwell_time_tracker import DwellTimeTracker
from app.services.shelf_zone import shelf_zone

# ----------------------------
# InsightFace Pipeline
# ----------------------------

from app.gaze.face_analyzer import FaceAnalyzer
from app.gaze.head_pose import HeadPoseEstimator
from app.gaze.gaze_estimator import GazeEstimator
from app.gaze.attention import AttentionAnalyzer
from app.gaze.pose_smoother import PoseSmoother
from app.gaze.geometric_attention import GeometricAttention
from app.gaze.attention_confidence import AttentionConfidence
# ----------------------------
# Database
# ----------------------------

from app.core.database import SessionLocal
from app.services.shelf_loader import load_shelf_regions
from app.gaze.shelf_regions import ShelfRegions



from app.schemas.shopper_tracking import ShopperTrackingCreate
from app.schemas.shopper_dwell_time import ShopperDwellTimeCreate
from app.schemas.shopper_attention import ShopperAttentionCreate 
from app.schemas.shopper_behavior import ShopperBehaviorCreate

from app.services.tracking_service import tracking_service
from app.services.dwell_time_service import dwell_time_service
from app.services.attention_service import attention_service
from app.services.analytics_service import save_interaction 
from app.services.shopper_behavior_service import shopper_behavior_service

from app.services.behavior_tracker import BehaviorTracker 
from app.services.heatmap_service import heatmap_service
# ----------------------------
# Save every N frames
# ----------------------------



class VideoProcessor:

    def __init__(self, source=0):

        self.source = source

        self.cap = cv2.VideoCapture(source)

        if not self.cap.isOpened():

            raise RuntimeError(
                f"Unable to open video source: {source}"
            )

        # ----------------------------
        # Dwell Time
        # ----------------------------

        self.dwell_tracker = DwellTimeTracker(
            exit_timeout=2.0
        )
        self.pose_smoother = PoseSmoother(
            window_size=5
        )
        # ----------------------------
        # Face Analyzer
        # ----------------------------

        self.face_analyzer = FaceAnalyzer()

        # ----------------------------
        # Head Pose
        # ----------------------------

        self.head_pose = HeadPoseEstimator()

        # ----------------------------
        # Gaze
        # ----------------------------

        self.gaze_estimator = GazeEstimator()

        # ----------------------------
        # Attention
        # ----------------------------

        self.attention = AttentionAnalyzer()
        self.geometric_attention = GeometricAttention()



        db = SessionLocal()

        try:

            shelves = load_shelf_regions(db)

            self.geometric_attention.shelves.update_shelves(
                shelves
            )

            shelf_zone.update_shelves(
                shelves
            )

            print("✓ Shelf coordinates loaded")

        finally:

            db.close()
        self.attention_confidence = AttentionConfidence()   
        self.prev_time = time.time()
        # Face cache
        self.face_cache = {}
        self.face_cache_frames = {}

        self.age_gender_cache = {}
        self.age_gender_cache_frames = {}

        # Run face detection every N frames
        self.FACE_INTERVAL = 3

        # Keep cache alive for N frames
        self.CACHE_LIFE = 10
        self.AGE_REFRESH_INTERVAL = 30
        self.SAVE_INTERVAL=10
        self.frame_count = 0 
        self.behavior_tracker = BehaviorTracker()

    def process(self):

        db = SessionLocal()

        frame_number = 0

        try:

            while True:
                geo_result=None 
                confidence=0.0
                ret, frame = self.cap.read()

                if not ret:
                    print("Video Finished")
                    break

                self.frame_count += 1

                
                current_time = time.time()

                fps = 1.0 / (current_time - self.prev_time)

                self.prev_time = current_time

                
                                # =====================================================
                # YOLO PERSON DETECTION
                # =====================================================

                results = detector.model(
                    frame,
                    conf=detector.confidence,
                    verbose=False
                )

                # =====================================================
                # BYTE TRACK
                # =====================================================

                tracked = tracker.update(
                    results[0]
                )

                tracking_data = tracker.get_tracking_data(
                    tracked
                )

                visible_shoppers = {}
                current_shelf_name = "None"
                # =====================================================
                # PROCESS EACH SHOPPER
                # =====================================================

                for person in tracking_data:
                    geo_result = None
                    confidence = 0.0
                    age = None
                    gender = None
                    # -----------------------------
                    # Bounding Box
                    # -----------------------------

                    x1, y1, x2, y2 = person["bbox"]

                    bbox = (
                        x1,
                        y1,
                        x2,
                        y2
                    )

                    # -----------------------------
                    # Track ID
                    # -----------------------------

                    track_id = person["track_id"]

                    confidence = person["confidence"]

                    # -----------------------------
                    # Shopper Center
                    # -----------------------------

                    center_x, center_y = shelf_zone.get_center(
                        x1,
                        y1,
                        x2,
                        y2
                    )
                    heatmap_service.add_point(
                        center_x,
                        center_y
                    )

                    # -----------------------------
                    # Shelf Detection
                    # -----------------------------

                    current_shelf_name = shelf_zone.detect_shelf(
                        x1,
                        y1,
                        x2,
                        y2
                    )
                    shelf_name=current_shelf_name

                    visible_shoppers[track_id] = {

                        "bbox": bbox,

                        "center": (
                            center_x,
                            center_y
                        ),

                        "confidence": confidence,

                        "shelf_name": shelf_name

                    }
                    self.behavior_tracker.update(
                        track_id=track_id,
                        center=(center_x, center_y),
                        shelf_name=shelf_name
                    )

                    # =====================================================
                    # DEFAULT VALUES
                    # =====================================================

                    yaw = 0.0
                    pitch = 0.0
                    roll = 0.0

                    gaze_vector = (
                        0.0,
                        0.0,
                        1.0
                    )

                    attention = "Unknown"

                    # =====================================================
                    # NEXT PART STARTS HERE
                    # InsightFace Face Analyzer
                    # =====================================================
                                        # ==========================================
                    # FACE ANALYSIS
                    # ==========================================

                    # =====================================================
# FACE CACHE
# =====================================================

                    analysis = None

                        # Check if cached result exists
                    if track_id in self.face_cache:

                            cache_age = self.frame_count - self.face_cache_frames[track_id]

                            if cache_age <= self.CACHE_LIFE:

                                # Use cached result
                                analysis = self.face_cache[track_id]

                        # Refresh the cache every FACE_INTERVAL frames
                    if analysis is None or self.frame_count % self.FACE_INTERVAL == 0:

                            new_analysis = self.face_analyzer.analyze(
                                frame,
                                bbox
                            )

                            if new_analysis is not None:

                                analysis = new_analysis

                                self.face_cache[track_id] = new_analysis

                                self.face_cache_frames[track_id] = self.frame_count

                        # No face found
                    if analysis is None:

                            cv2.putText(
                                frame,
                                "No Face",
                                (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.6,
                                (0,0,255),
                                2
                            )

                            continue
                    # -----------------------------------------
                    # Face Information
                    # -----------------------------------------

                    face_crop = analysis["face_crop"]

                    face_bbox = analysis["face_bbox"]

                    face_score = analysis["score"]

                    keypoints = analysis["kps"]

                    landmarks2d = analysis["landmarks_2d"]
                    nose = landmarks2d[52]

                    nose_point = (
                        int(nose[0]),
                        int(nose[1])
                    )

                    landmarks3d = analysis["landmarks_3d"]

                   # ==========================================
# AGE & GENDER CACHE
# ==========================================

                    if (
                        track_id not in self.age_gender_cache
                        or
                        self.frame_count - self.age_gender_cache_frames[track_id]
                        >= self.AGE_REFRESH_INTERVAL
                    ):

                        age = analysis["age"]
                        gender = analysis["gender"]

                        self.age_gender_cache[track_id] = (
                            age,
                            gender
                        )

                        self.age_gender_cache_frames[track_id] = self.frame_count

                    else:

                        age, gender = self.age_gender_cache[track_id]

                    # -----------------------------------------
                    # Draw Face Box
                    # -----------------------------------------

                    fx1, fy1, fx2, fy2 = face_bbox

                    cv2.rectangle(
                        frame,
                        (fx1, fy1),
                        (fx2, fy2),
                        (0, 255, 255),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"{face_score:.2f}",
                        (fx1, fy1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (0,255,255),
                        2
                    )

                    # -----------------------------------------
                    # Draw 106 Landmarks
                    # -----------------------------------------

                    if landmarks2d is not None:

                        offset_x = x1
                        offset_y = y1

                        for p in landmarks2d:

                            cv2.circle(
                                frame,
                                (
                                    int(p[0]) + offset_x,
                                    int(p[1]) + offset_y
                                ),
                                1,
                                (0,255,0),
                                -1
                            )

                    # ==========================================
                    # NEXT PART
                    # Head Pose
                    # ==========================================
                                        # ==========================================
                    # HEAD POSE ESTIMATION
                    # ==========================================

                    yaw, pitch, roll = self.head_pose.estimate_pose(
                        keypoints,
                        face_crop.shape
                    )
                    yaw, pitch, roll = self.pose_smoother.smooth(
                        yaw,
                        pitch,
                        roll
                    )

                    geo_result = self.geometric_attention.detect_attention(
                        nose_point=nose_point,
                        yaw=yaw,
                        pitch=pitch
                    )
                    if geo_result is not None:    
                        self.geometric_attention.draw(
                            frame,
                            geo_result
                        )
    
                    # ==========================================
                    # GAZE ESTIMATION
                    # ==========================================

                    gaze_vector = self.gaze_estimator.estimate_gaze(
                        yaw,
                        pitch
                    )

                    gaze_x, gaze_y, gaze_z = gaze_vector

                    # ==========================================
                    # ATTENTION ANALYSIS
                    # ==========================================

                    attention = self.attention.detect_attention(
                        yaw,
                        pitch,
                        shelf_name
                    )
                    # -------------------------------------
                    # Attention Confidence
                    # -------------------------------------

                    confidence = self.attention_confidence.calculate(

                        face_score=face_score,

                        yaw=yaw,

                        pitch=pitch,

                        attention=geo_result["attention"]

                    )
                    # ==========================================
                    # DRAW GAZE LINE
                    # ==========================================

                    face_center_x = int((fx1 + fx2) / 2)
                    face_center_y = int((fy1 + fy2) / 2)

                    gaze_length = 80

                    end_x = int(
                        face_center_x +
                        gaze_x * gaze_length
                    )

                    end_y = int(
                        face_center_y -
                        gaze_y * gaze_length
                    )

                    cv2.arrowedLine(
                        frame,
                        (face_center_x, face_center_y),
                        (end_x, end_y),
                        (255, 0, 0),
                        2,
                        tipLength=0.25
                    )

                    # ==========================================
                    # DRAW HEAD POSE
                    # ==========================================

                    cv2.putText(
                        frame,
                        f"Yaw : {yaw:.1f}",
                        (fx1, fy2 + 20),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (255,255,0),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Pitch : {pitch:.1f}",
                        (fx1, fy2 + 42),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (255,255,0),
                        2
                    )

                    cv2.putText(
                        frame,
                        f"Roll : {roll:.1f}",
                        (fx1, fy2 + 64),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.55,
                        (255,255,0),
                        2
                    )

                    # ==========================================
                    # DRAW AGE / GENDER
                    # ==========================================

                    if age is not None:

                        cv2.putText(
                            frame,
                            f"Age : {age}",
                            (fx1, fy2 + 86),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.55,
                            (0,255,255),
                            2
                        )

                    if gender is not None:

                        gender_text = (
                            "Male"
                            if gender == 1
                            else "Female"
                        )

                        cv2.putText(
                            frame,
                            gender_text,
                            (fx1, fy2 + 108),
                            cv2.FONT_HERSHEY_SIMPLEX,
                            0.55,
                            (0,255,255),
                            2
                        )

                    # ==========================================
                    # DRAW ATTENTION STATUS
                    # ==========================================

                    color = (
                        (0,255,0)
                        if "Looking At" in attention
                        else (0,0,255)
                    )

                    cv2.putText(
                        frame,
                        attention,
                        (fx1, fy2 + 130),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.60,
                        color,
                        2
                    )

                    # ==========================================
                    # SAVE VARIABLES
                    # ==========================================

                    shopper_result = {

                        "track_id": track_id,

                        "bbox": bbox,

                        "face_bbox": face_bbox,

                        "yaw": yaw,

                        "pitch": pitch,

                        "roll": roll,

                        "gaze_vector": gaze_vector,

                        "attention": attention,
                        "geo_attention": geo_result["attention"] if geo_result else False,

                        "geo_shelf": geo_result["shelf"] if geo_result else "None",

                        "age": age,

                        "gender": gender,

                        "shelf_name": shelf_name

                    }

                    # ==========================================
                    # NEXT PART
                    # Database Saving
                    # ==========================================
                                        # ==========================================
                    # ==========================================
# SAVE TRACKING
# ==========================================

                    if frame_number >0 and frame_number % self.SAVE_INTERVAL == 0:

                        tracking_data = ShopperTrackingCreate(

                        track_id=track_id,

                        x1=x1,
                        y1=y1,

                        x2=x2,
                        y2=y2,

                        confidence=float(confidence),

                        frame_number=frame_number,

                        shelf_name=shelf_name

                    )
                        print("===================================")
                        print("TYPE :", type(tracking_data))
                        print("VALUE:", tracking_data)
                        print("===================================") 


                        tracking_service.save_tracking(
                            db,
                            tracking_data
                        )
                    # ==========================================
                    # DWELL TIME
                    # ==========================================

                    dwell_time = self.dwell_tracker.get_dwell_time(
                        track_id
                    )

                    cv2.putText(

                        frame,

                        f"Dwell : {dwell_time:.2f}s",

                        (x1, y2 + 150),

                        cv2.FONT_HERSHEY_SIMPLEX,

                        0.6,

                        (255,255,255),

                        2

                    )

                    # ==========================================
                    # SAVE ATTENTION
                    # ==========================================

                    if frame_number >0 and frame_number % self.SAVE_INTERVAL == 0:

                        attention_data = ShopperAttentionCreate(

                            track_id=track_id,

                            shelf_name=shelf_name,

                            attention=attention,

                            yaw=float(yaw),

                            pitch=float(pitch),

                            roll=float(roll),

                            frame_number=frame_number

                        )

                        attention_service.save_attention(

                            db,

                            attention_data

                        )
                    # ==========================================
                    # DRAW SHOPPER BOX
                    # ==========================================

                    cv2.rectangle(

                        frame,

                        (x1, y1),

                        (x2, y2),

                        (0,255,0),

                        2

                    )

                    cv2.putText(

                        frame,

                        f"ID : {track_id}",

                        (x1, y1-30),

                        cv2.FONT_HERSHEY_SIMPLEX,

                        0.6,

                        (0,255,0),

                        2

                    )
                # ==========================================
            # UPDATE DWELL TRACKER
            # ==========================================

                self.dwell_tracker.update(
                    visible_shoppers
                )
                self.dwell_tracker.update(
                    visible_shoppers
                )
        # ==========================================
            # PROCESS EXITED SHOPPERS
            # ==========================================

                completed_records = self.dwell_tracker.get_completed_dwell_times()
                print("Completed Records:")
                print(completed_records)

                for record in completed_records:

                    dwell_record = ShopperDwellTimeCreate(
                        track_id=record["track_id"],
                        entry_time=record["entry_time"],
                        exit_time=record["exit_time"],
                        dwell_time_seconds=record["dwell_time_seconds"],
                    )

                    dwell_time_service.save_dwell_time(
                        db,
                        dwell_record,
                    )

                    save_interaction(
                        customer_id=record["track_id"],
                        shelf_name=record["shelf_name"],
                        entry_time=record["entry_time"],
                        exit_time=record["exit_time"],
                        dwell_time=record["dwell_time_seconds"],
                    )

                    print("=" * 60)
                    print("CUSTOMER INTERACTION SAVED")
                    print(record)
                    print("=" * 60) 

                    behavior = self.behavior_tracker.finish(
                        record["track_id"]
                    )

                    if behavior:
                        behavior_data = ShopperBehaviorCreate(

                            track_id=behavior["track_id"],

                            entry_time=behavior["entry_time"],

                            exit_time=behavior["exit_time"],

                            dwell_time=behavior["dwell_time"],

                            path_length=behavior["path_length"],

                            shelves_visited=behavior["shelves_visited"],

                            behavior_segment=behavior["behavior_segment"]

                        )

                        shopper_behavior_service.save_behavior(
                            db,
                            behavior_data
                        )      

                cv2.putText(
                        frame,
                        f"Old : {current_shelf_name}",
                        (20, 140),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 0),
                        2
                    )
                geo_text = "None"

                if geo_result is not None:

                    geo_text = geo_result["shelf"]

                cv2.putText(

                    frame,

                    f"Geo : {geo_text}",

                    (20,170),

                    cv2.FONT_HERSHEY_SIMPLEX,

                    0.6,

                    (0,255,0),

                    2

                )
                cv2.putText(

                    frame,

                    f"Conf : {confidence:.1f}%",

                    (20,200),

                    cv2.FONT_HERSHEY_SIMPLEX,

                    0.6,

                    (255,255,0),

                    2

                )
                      
                remove_ids = []

                for tid in self.face_cache_frames:

                    cache_age = self.frame_count - self.face_cache_frames[tid]

                    if cache_age > self.CACHE_LIFE:
                        remove_ids.append(tid)

                for tid in remove_ids:

                    self.face_cache.pop(tid, None)
                    self.face_cache_frames.pop(tid, None)

                remove_ids = []

                for tid in self.age_gender_cache_frames:

                    age_of_cache = (
                        self.frame_count -
                        self.age_gender_cache_frames[tid]
                    )

                    if age_of_cache > 300:

                        remove_ids.append(tid)

                for tid in remove_ids:

                    self.age_gender_cache.pop(tid, None)

                    self.age_gender_cache_frames.pop(tid, None)  


                # ==========================================
                # GENERATE HEATMAP EVERY 100 FRAMES
                # ==========================================
                if self.frame_count % 100 == 0:

                    heatmap_service.generate_heatmap(
                        frame
                    )      
               
                                    # ==========================================
                # DISPLAY FRAME
                # ==========================================
                cv2.putText(
                    frame,
                    f"FPS : {fps:.1f}",
                    (20,30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0,255,255),
                    2
                )
                cv2.imshow(
                    "Consumer Attention System",
                    frame
                )

                frame_number += 1

                key = cv2.waitKey(1) & 0xFF

                if key == ord("q"):

                    print("Video Processor Interrupted")

                    break

        except KeyboardInterrupt:

            print("\nVideo Processor Interrupted")

        except Exception:
            traceback.print_exc()

        finally:

            print("Releasing Resources...")

            if db:

                db.close()

            if self.cap:

                self.cap.release()

            cv2.destroyAllWindows()


# ==========================================================
# MAIN
# ==========================================================

if __name__ == "__main__":

    print("=" * 60)
    print("Consumer Attention System")
    print("Milestone 2")
    print("Shopper Tracking + Dwell Time + Gaze + Attention")
    print("=" * 60)

    processor = VideoProcessor(
        source=0
    )

    processor.process()