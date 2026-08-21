from ultralytics import YOLO


class PersonTracker:
    """
    YOLOv8 + ByteTrack Tracking Service

    Responsibilities:
    - Load YOLO model once
    - Detect only persons
    - Assign persistent IDs using ByteTrack
    """

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence: float = 0.5,
    ):
        self.model = YOLO(model_path)
        self.confidence = confidence

        print("\n==============================")
        print("YOLOv8 + ByteTrack Loaded")
        print("==============================\n")

    def track(self, frame):
        """
        Detect and track people.

        Returns:
            list[Results]
        """

        results = self.model.track(
            source=frame,
            persist=True,                #to remember ids
            tracker="bytetrack.yaml",
            classes=[0],
            conf=self.confidence,
            verbose=False,
        )

        return results