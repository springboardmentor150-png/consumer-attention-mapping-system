from ultralytics import YOLO


class PersonDetector:
    """
    YOLOv8 Person Detection Service

    Responsibilities:
    - Load YOLO model only once
    - Detect only persons (COCO Class 0)
    - Return inference results
    """

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence: float = 0.5
    ):
        self.confidence = confidence

        print("\n==============================")
        print("Loading YOLOv8 Model...")
        self.model = YOLO(model_path)
        print("YOLOv8 Loaded Successfully!")
        print("==============================\n")

    def detect(self, frame):
        """
        Detect persons in a frame.

        Parameters
        ----------
        frame : numpy.ndarray
            Image frame from OpenCV.

        Returns
        -------
        list
            YOLO Results object.
        """

        if frame is None:
            return []

        results = self.model.predict(
            source=frame,
            classes=[0],          # Person only
            conf=self.confidence,
            verbose=False
        )

        return results