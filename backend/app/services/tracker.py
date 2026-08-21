"""
tracker.py

ByteTrack Tracking Service

This module receives person detections from detector.py
and assigns a unique tracking ID to each detected shopper.
"""

import supervision as sv


class ShopperTracker:
    def __init__(
        self,
        track_activation_threshold=0.25,
        lost_track_buffer=30,
        minimum_matching_threshold=0.8,
        frame_rate=30,
    ):
        """
        Initialize ByteTrack tracker.
        """

        self.tracker = sv.ByteTrack(
            track_activation_threshold=track_activation_threshold,
            lost_track_buffer=lost_track_buffer,
            minimum_matching_threshold=minimum_matching_threshold,
            frame_rate=frame_rate,
        )

    def update(self, yolo_results):
        """
        Update tracker with YOLO results.

        Args:
            yolo_results:
                results[0] returned by YOLO model

        Returns:
            supervision.Detections with tracker_id populated.
        """

        detections = sv.Detections.from_ultralytics(yolo_results)

        tracked_detections = self.tracker.update_with_detections(
            detections
        )

        return tracked_detections

    def get_tracking_data(self, tracked_detections):
        """
        Convert tracked detections into a list of dictionaries.

        Returns:
            [
                {
                    "track_id": 3,
                    "bbox": [x1,y1,x2,y2],
                    "confidence":0.93
                }
            ]
        """

        tracking_data = []

        for i in range(len(tracked_detections.xyxy)):

            x1, y1, x2, y2 = tracked_detections.xyxy[i]

            confidence = float(tracked_detections.confidence[i])

            if tracked_detections.tracker_id is None:
                track_id = -1
            else:
                track_id = int(tracked_detections.tracker_id[i])

            tracking_data.append(
                {
                    "track_id": track_id,
                    "bbox": [
                        int(x1),
                        int(y1),
                        int(x2),
                        int(y2),
                    ],
                    "confidence": confidence,
                }
            )

        return tracking_data


# Singleton tracker instance
tracker = ShopperTracker()