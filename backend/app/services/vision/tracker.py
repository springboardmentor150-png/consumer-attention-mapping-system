import os
import torch
import cv2
from ultralytics import YOLO

# 4-Core CPU Parallelism Configuration
NUM_CORES = 4
os.environ["OMP_NUM_THREADS"] = str(NUM_CORES)
os.environ["MKL_NUM_THREADS"] = str(NUM_CORES)
os.environ["OPENBLAS_NUM_THREADS"] = str(NUM_CORES)

try:
    torch.set_num_threads(NUM_CORES)
    torch.set_num_interop_threads(NUM_CORES)
except Exception:
    pass

try:
    cv2.setNumThreads(NUM_CORES)
except Exception:
    pass


class PersonTracker:
    """
    4-Core Accelerated YOLOv8 + ByteTrack Tracking Engine.
    """

    def __init__(
        self,
        model_path: str = "yolov8n.pt",
        confidence: float = 0.4,
    ):
        self.model = YOLO(model_path)
        self.confidence = confidence

        print("\n==============================")
        print(f"YOLOv8 + ByteTrack Active (4 Cores, {torch.get_num_threads()} PyTorch Threads)")
        print("==============================\n")

    def track(self, frame):
        """
        Fast multi-threaded person detection and tracking.
        """
        with torch.inference_mode():
            results = self.model.track(
                source=frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=[0],
                conf=self.confidence,
                imgsz=640,
                verbose=False,
            )

        return results