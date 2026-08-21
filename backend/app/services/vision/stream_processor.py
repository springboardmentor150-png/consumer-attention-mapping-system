import cv2
import time
import numpy as np
from typing import Union, Optional, Tuple, Dict, Any
from loguru import logger

class StreamProcessor:
    def __init__(self):
        self.cap: Optional[cv2.VideoCapture] = None
        self.source: Optional[Union[str, int]] = None
        self.frame_count: int = 0
        self.start_time: float = 0.0

    def open_stream(self, source: Union[str, int]) -> bool:
        """
        Open a video stream from a webcam index, RTSP URL, or file path.
        """
        self.release()  # Clean up existing resources if any
        self.source = source
        self.frame_count = 0
        self.start_time = time.time()

        logger.info(f"Attempting to open stream source: {source}")

        # Check if source is a digit string (representing a webcam index)
        if isinstance(source, str) and source.isdigit():
            source = int(source)

        try:
            self.cap = cv2.VideoCapture(source)
            if not self.cap.isOpened():
                logger.error(f"Failed to open video capture source: {source}")
                self.cap = None
                return False
        except Exception as e:
            logger.error(f"Exception raised while opening source {source}: {str(e)}")
            self.cap = None
            return False

        logger.info(f"Successfully opened video stream source: {source}")
        return True

    def read_frame(self) -> Tuple[bool, Optional[np.ndarray]]:
        """
        Read a single frame from the video capture.
        """
        if self.cap is None or not self.cap.isOpened():
            return False, None

        try:
            ret, frame = self.cap.read()
            if ret:
                self.frame_count += 1
            return ret, frame
        except Exception as e:
            logger.error(f"Error reading frame from source {self.source}: {str(e)}")
            return False, None

    def resize_frame(self, frame: np.ndarray, width: int = 640, height: int = 480) -> np.ndarray:
        """
        Resize frame to specified dimensions.
        """
        if frame is None:
            return None
        return cv2.resize(frame, (width, height))

    def get_frame_metadata(self) -> Dict[str, Any]:
        """
        Get metadata about the current state of the stream.
        """
        fps = 0.0
        width = 0
        height = 0

        if self.cap:
            fps = self.cap.get(cv2.CAP_PROP_FPS)
            width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Fallback if FPS is not reported correctly by the driver/source
        if fps <= 0:
            elapsed = time.time() - self.start_time
            fps = self.frame_count / elapsed if elapsed > 0 else 30.0

        return {
            "timestamp": time.time(),
            "frame_count": self.frame_count,
            "fps": fps,
            "resolution": f"{width}x{height}" if width > 0 and height > 0 else "Unknown"
        }

    def release(self) -> None:
        """
        Release VideoCapture and reset variables.
        """
        if self.cap is not None:
            logger.info(f"Releasing stream source: {self.source}")
            self.cap.release()
            self.cap = None
        self.source = None
