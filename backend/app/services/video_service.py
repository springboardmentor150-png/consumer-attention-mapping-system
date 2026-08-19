import cv2
import supervision as sv

from app.ai.detector import PersonDetector
from app.ai.gaze_projection import GazeProjection
from app.ai.shelf_mapper import ShelfMapper
from app.ai.tracker import PersonTracker
from app.ai.zone_checker import ZoneChecker
from app.database.database import SessionLocal
from app.repositories.heatmap_repository import HeatmapRepository
from app.repositories.path_repository import PathRepository
from app.repositories.shelf_repository import ShelfRepository
from app.services.attention_score import AttentionScore
from app.services.attention_service import AttentionService
from app.services.attention_timer import AttentionTimer
from app.services.dwell_timer import DwellTimer
from app.services.gaze_service import GazeService
from app.services.heatmap_service import HeatmapService
from app.services.path_tracker import PathTracker
from app.services.tracking_service import TrackingService
from app.services.zone_transition import ZoneTransition


class VideoProcessor:

    def __init__(self):
        self.detector = PersonDetector()
        self.tracker = PersonTracker()
        self.zone = ZoneChecker()
        self.timer = DwellTimer()
        self.gaze_service = GazeService()
        self.shelf_db = SessionLocal()
        self.shelf_repository = ShelfRepository(self.shelf_db)
        self.mapper = ShelfMapper(self.shelf_repository.get_polygons())
        self.projector = GazeProjection()
        self.heatmap = HeatmapService()
        self.heatmap_db = SessionLocal()
        self.heatmap_repository = HeatmapRepository(self.heatmap_db)
        self.path_db = SessionLocal()
        self.path_repository = PathRepository(self.path_db)
        self.path_tracker = PathTracker()
        self.zone_transition = ZoneTransition()
        self.attention_timer = AttentionTimer()
        self.attention_score = AttentionScore()
        self.attention_db = SessionLocal()
        self.attention_service = AttentionService(self.attention_db)
        self.attention_state = {}
        self.box_annotator = sv.BoxAnnotator()
        self.label_annotator = sv.LabelAnnotator()
        self.tracking_service = None

    def _init_tracking_service(self):
        if self.tracking_service is None:
            self.tracking_service = TrackingService(SessionLocal())

    def _save_session(self, person_id, shelf_id, entry, exit, dwell):
        self._init_tracking_service()
        self.tracking_service.save_session(
            person_id=person_id,
            store_id=1,
            shelf_id=shelf_id,
            entry=entry,
            exit=exit,
            dwell=dwell,
        )

    def _init_attention_service(self, db):
        if self.attention_service is None:
            self.attention_service = AttentionService(db)

    def _save_heatmap_point(self, person_id, shelf_id, center):
        x, y = int(center[0]), int(center[1])
        self.heatmap_repository.save(person_id, 1, shelf_id, x, y)

    def _save_path_point(self, person_id, frame_no, center):
        x, y = int(center[0]), int(center[1])
        self.path_repository.save(person_id, 1, frame_no, x, y)

    def process(self, source=0):
        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            raise RuntimeError(f"Unable to open video source: {source}")

        try:
            frame_no = 0
            while True:
                success, frame = cap.read()
                if not success:
                    break

                results = self.detector.detect(frame)
                detections = sv.Detections.from_ultralytics(results[0])
                detections = self.tracker.update(detections)
                frame_no += 1

                current_ids = set(int(tid) for tid in detections.tracker_id)

                for tracker_id, bbox in zip(detections.tracker_id, detections.xyxy):
                    tracker_id = int(tracker_id)
                    x1, y1, x2, y2 = bbox
                    center = ((x1 + x2) / 2, (y1 + y2) / 2)
                    shelf_id = self.zone.get_shelf(center)

                    self.path_tracker.update(tracker_id, (int(center[0]), int(center[1])))
                    self._save_path_point(tracker_id, frame_no, center)

                    transition = self.zone_transition.update(tracker_id, shelf_id)
                    if transition is not None:
                        old_shelf, new_shelf = transition
                        print(
                            f"Person {tracker_id} moved from shelf {old_shelf} to shelf {new_shelf}"
                        )

                    if shelf_id is not None:
                        self.timer.person_enter(tracker_id, shelf_id)
                        self._save_heatmap_point(tracker_id, shelf_id, center)
                    elif tracker_id in self.timer.active:
                        result = self.timer.person_exit(tracker_id)
                        if result is not None:
                            entry, exit, dwell, ended_shelf_id = result
                            self._save_session(
                                tracker_id,
                                shelf_id=ended_shelf_id,
                                entry=entry,
                                exit=exit,
                                dwell=dwell,
                            )
                            print(f"Person {tracker_id} exited after {dwell:.2f}s")

                for pid in list(self.timer.active.keys()):
                    if pid not in current_ids:
                        result = self.timer.person_exit(pid)
                        if result is not None:
                            entry, exit, dwell, ended_shelf_id = result
                            self._save_session(
                                pid,
                                shelf_id=ended_shelf_id,
                                entry=entry,
                                exit=exit,
                                dwell=dwell,
                            )
                            print(f"Person {pid} exited after {dwell:.2f}s")

                labels = []
                for tracker_id, confidence in zip(detections.tracker_id, detections.confidence):
                    labels.append(f"ID {tracker_id} {confidence:.2f}")

                frame, gaze_data = self.gaze_service.process(frame)

                self.heatmap.update(detections)

                if gaze_data is not None:
                    gaze_direction = gaze_data["direction"]
                    yaw = gaze_data["yaw"]
                    pitch = gaze_data["pitch"]

                    for tracker_id, bbox, confidence in zip(detections.tracker_id, detections.xyxy, detections.confidence):
                        tracker_id = int(tracker_id)
                        x1, y1, x2, y2 = bbox
                        face_center = (
                            int((x1 + x2) / 2),
                            int((y1 + y2) / 4),
                        )
                        point = self.projector.project(face_center, yaw)
                        shelf = self.mapper.detect(point)

                        cv2.line(frame, face_center, point, (255, 0, 0), 3)

                        if shelf:
                            cv2.putText(
                                frame,
                                f"Viewing Shelf {shelf}",
                                (20, 180),
                                cv2.FONT_HERSHEY_SIMPLEX,
                                0.8,
                                (0, 255, 255),
                                2,
                            )

                            last_shelf = self.attention_state.get(tracker_id)
                            if last_shelf != shelf:
                                if last_shelf is not None:
                                    duration = self.attention_timer.finish(tracker_id, last_shelf)
                                    if duration > 0:
                                        score = self.attention_score.calculate(
                                            duration,
                                            float(confidence),
                                            1,
                                            yaw,
                                        )
                                        self.attention_service.save(
                                            tracker_id,
                                            1,
                                            last_shelf,
                                            duration,
                                            score,
                                            gaze_direction,
                                            yaw,
                                            pitch,
                                        )
                                        print(
                                            {
                                                "person": tracker_id,
                                                "shelf": last_shelf,
                                                "duration": duration,
                                                "score": score,
                                            }
                                        )
                                self.attention_state[tracker_id] = shelf
                                self.attention_timer.update(tracker_id, shelf)
                            else:
                                self.attention_timer.update(tracker_id, shelf)
                        else:
                            if tracker_id in self.attention_state:
                                previous_shelf = self.attention_state.pop(tracker_id)
                                duration = self.attention_timer.finish(tracker_id, previous_shelf)
                                if duration > 0:
                                    score = self.attention_score.calculate(
                                        duration,
                                        float(confidence),
                                        1,
                                        yaw,
                                    )
                                    self.attention_service.save(
                                        tracker_id,
                                        1,
                                        previous_shelf,
                                        duration,
                                        score,
                                        gaze_direction,
                                        yaw,
                                        pitch,
                                    )
                                    print(
                                        {
                                            "person": tracker_id,
                                            "shelf": previous_shelf,
                                            "duration": duration,
                                            "score": score,
                                        }
                                    )

                frame = self.box_annotator.annotate(frame, detections)
                frame = self.label_annotator.annotate(frame, detections, labels)
                frame = self.path_tracker.draw(frame)

                for tracker_id in list(self.attention_state):
                    if tracker_id not in current_ids:
                        previous_shelf = self.attention_state.pop(tracker_id)
                        duration = self.attention_timer.finish(tracker_id, previous_shelf)
                        if duration > 0:
                            score = self.attention_score.calculate(duration, 0.0, 1, 0)
                            self.attention_service.save(
                                tracker_id,
                                1,
                                previous_shelf,
                                duration,
                                score,
                                "CENTER",
                                0.0,
                                0.0,
                            )
                            print(
                                {
                                    "person": tracker_id,
                                    "shelf": previous_shelf,
                                    "duration": duration,
                                    "score": score,
                                }
                            )

                fps = cap.get(cv2.CAP_PROP_FPS) or 0.0
                cv2.putText(
                    frame,
                    f"FPS: {fps:.2f}",
                    (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    1,
                    (0, 255, 0),
                    2,
                    cv2.LINE_AA,
                )

                cv2.imshow("Consumer Attention Mapping", frame)

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
        finally:
            cap.release()
            cv2.destroyAllWindows()
