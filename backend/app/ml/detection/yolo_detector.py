"""
YOLOv11 Person & Product Detector
Uses ultralytics YOLOv11 (yolo11n.pt for persons, custom weights for products).
"""

import os
import logging
import numpy as np
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# COCO class index for person
PERSON_CLASS_ID = 0

# Model paths from environment
PERSON_MODEL_PATH = os.getenv("PERSON_MODEL_PATH", "models/yolo11n.pt")
PRODUCT_MODEL_PATH = os.getenv("PRODUCT_MODEL_PATH", "models/product_yolo11.pt")

# Detection thresholds (configurable via env)
PERSON_CONF_THRESHOLD = float(os.getenv("PERSON_CONF_THRESHOLD", "0.12"))
PRODUCT_CONF_THRESHOLD = float(os.getenv("PRODUCT_CONF_THRESHOLD", "0.35"))
IOU_THRESHOLD = float(os.getenv("IOU_THRESHOLD", "0.45"))


@dataclass
class Detection:
    """Single object detection result."""
    class_id: int
    class_name: str
    confidence: float
    bbox: Tuple[float, float, float, float]  # x1, y1, x2, y2 (normalized 0-1)
    center_x: float
    center_y: float
    track_id: Optional[int] = None


class YOLOv11Detector:
    """
    YOLOv11-based detector for persons and retail products.
    Uses ultralytics >= 8.3.0 which supports yolo11*.pt model weights.
    """

    def __init__(
        self,
        person_model_path: str = PERSON_MODEL_PATH,
        product_model_path: Optional[str] = None,
        person_conf: float = PERSON_CONF_THRESHOLD,
        product_conf: float = PRODUCT_CONF_THRESHOLD,
        iou: float = IOU_THRESHOLD,
        device: str = "cpu"
    ):
        self.person_conf = person_conf
        self.product_conf = product_conf
        self.iou = iou
        self.device = device

        self._person_model = None
        self._product_model = None

        self._load_person_model(person_model_path)
        if product_model_path and os.path.exists(product_model_path):
            self._load_product_model(product_model_path)

    def _load_person_model(self, path: str):
        """Load YOLOv11 for person detection using ONNXRuntime, OpenCV DNN, or Ultralytics."""
        # 1. Check for ONNX model first (most portable & fast across all environments)
        onnx_candidates = [
            path.replace(".pt", ".onnx"),
            "backend/models/yolo11n.onnx",
            "models/yolo11n.onnx",
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "models", "yolo11n.onnx"),
            os.path.join(os.path.dirname(__file__), "..", "..", "models", "yolo11n.onnx")
        ]
        onnx_path = None
        for cand in onnx_candidates:
            if cand and os.path.exists(cand) and os.path.getsize(cand) > 1000000:
                onnx_path = os.path.abspath(cand)
                break

        if not onnx_path:
            # Auto-download yolo11n.onnx if not present
            try:
                import urllib.request
                target_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
                os.makedirs(target_dir, exist_ok=True)
                download_target = os.path.join(target_dir, "yolo11n.onnx")
                logger.info(f"Downloading yolo11n.onnx to {download_target}...")
                urllib.request.urlretrieve(
                    "https://github.com/ultralytics/assets/releases/download/v8.3.0/yolo11n.onnx",
                    download_target
                )
                if os.path.exists(download_target) and os.path.getsize(download_target) > 1000000:
                    onnx_path = os.path.abspath(download_target)
            except Exception as dl_err:
                logger.warning(f"Could not auto-download yolo11n.onnx: {dl_err}")

        # Try ONNXRuntime
        if onnx_path:
            try:
                import onnxruntime as ort
                opts = ort.SessionOptions()
                opts.intra_op_num_threads = 4
                self._ort_session = ort.InferenceSession(
                    onnx_path, sess_options=opts, providers=['CPUExecutionProvider']
                )
                self._ort_input_name = self._ort_session.get_inputs()[0].name
                self._ort_output_name = self._ort_session.get_outputs()[0].name
                self._is_onnx = True
                logger.info(f"Loaded YOLOv11 ONNX model via onnxruntime from {onnx_path}")
                return
            except Exception as ort_err:
                logger.warning(f"ONNXRuntime init failed: {ort_err}, trying OpenCV DNN...")

            try:
                import cv2
                self._cv_net = cv2.dnn.readNetFromONNX(onnx_path)
                self._is_cv_dnn = True
                logger.info(f"Loaded YOLOv11 ONNX model via cv2.dnn from {onnx_path}")
                return
            except Exception as cv_err:
                logger.warning(f"OpenCV DNN init failed: {cv_err}")

        # Fall back to Ultralytics PyTorch YOLO if available
        try:
            from ultralytics import YOLO
            if os.path.exists(path):
                self._person_model = YOLO(path)
                logger.info(f"Loaded person detection model from {path}")
            else:
                self._person_model = YOLO("yolo11n.pt")
                logger.info("Loaded PyTorch yolo11n.pt")
            return
        except Exception as e:
            logger.warning(f"PyTorch YOLO load failed: {e}")
            self._person_model = None

    def _load_product_model(self, path: str):
        """Load custom-trained YOLOv11 for product detection."""
        try:
            from ultralytics import YOLO
            self._product_model = YOLO(path)
            logger.info(f"Loaded product detection model from {path}")
        except Exception as e:
            logger.debug(f"Product model load note: {e}")
            self._product_model = None

    @property
    def is_person_model_loaded(self) -> bool:
        return (
            hasattr(self, "_ort_session") and self._ort_session is not None
        ) or (
            hasattr(self, "_cv_net") and self._cv_net is not None
        ) or (
            self._person_model is not None
        )

    @property
    def is_product_model_loaded(self) -> bool:
        return self._product_model is not None

    def _preprocess_onnx(self, frame: np.ndarray) -> Tuple[np.ndarray, float, int, int]:
        """Letterbox frame to 640x640 for YOLO ONNX inference."""
        import cv2
        ih, iw = frame.shape[:2]
        scale = min(640.0 / ih, 640.0 / iw)
        nh, nw = int(ih * scale), int(iw * scale)
        resized = cv2.resize(frame, (nw, nh), interpolation=cv2.INTER_LINEAR)

        top = (640 - nh) // 2
        bottom = 640 - nh - top
        left = (640 - nw) // 2
        right = 640 - nw - left

        padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))
        blob = cv2.cvtColor(padded, cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
        blob = np.transpose(blob, (2, 0, 1))
        blob = np.expand_dims(blob, axis=0)
        return blob, scale, left, top

    def _postprocess_onnx(
        self, output: np.ndarray, scale: float, left: int, top: int, orig_w: int, orig_h: int
    ) -> List[Detection]:
        """Convert YOLO ONNX output tensor (1, 84, 8400) to Detection list."""
        import cv2
        pred = np.squeeze(output, axis=0)
        if pred.shape[0] < pred.shape[1]:  # Shape is (84, 8400)
            pred = pred.T  # Transpose to (8400, 84)

        boxes_raw = pred[:, :4]
        scores_raw = pred[:, 4:]
        person_scores = scores_raw[:, PERSON_CLASS_ID]

        # Exclude non-human objects: person must be the dominant class or have confirmed person score
        top_classes = np.argmax(scores_raw, axis=1)
        is_person_dominant = (top_classes == PERSON_CLASS_ID) | (person_scores >= 0.14)
        mask = (person_scores >= self.person_conf) & is_person_dominant

        if not np.any(mask):
            return []

        boxes = boxes_raw[mask]
        scores = person_scores[mask]

        cx = boxes[:, 0]
        cy = boxes[:, 1]
        bw = boxes[:, 2]
        bh = boxes[:, 3]

        x1 = (cx - bw / 2.0 - left) / scale
        y1 = (cy - bh / 2.0 - top) / scale
        x2 = (cx + bw / 2.0 - left) / scale
        y2 = (cy + bh / 2.0 - top) / scale

        x1 = np.clip(x1, 0, orig_w)
        y1 = np.clip(y1, 0, orig_h)
        x2 = np.clip(x2, 0, orig_w)
        y2 = np.clip(y2, 0, orig_h)

        cv_boxes = [
            [int(x1[i]), int(y1[i]), int(x2[i] - x1[i]), int(y2[i] - y1[i])]
            for i in range(len(scores))
        ]
        indices = cv2.dnn.NMSBoxes(cv_boxes, scores.tolist(), self.person_conf, self.iou)

        detections = []
        if len(indices) > 0:
            for idx in indices.flatten():
                nx1 = float(x1[idx] / orig_w)
                ny1 = float(y1[idx] / orig_h)
                nx2 = float(x2[idx] / orig_w)
                ny2 = float(y2[idx] / orig_h)

                bw_n = nx2 - nx1
                bh_n = ny2 - ny1

                # PERSON ONLY VALIDATION:
                # 1. Human shopper poses (standing, walking, reaching for shelf items): bw/bh <= 1.25
                # 2. Minimum human height: bh_n >= 0.030
                # 3. Exclude non-human objects (flat shelves, boxes with w >> h, or microscopic noise)
                if (bw_n / max(1e-4, bh_n)) > 1.25:
                    continue
                if bh_n < 0.030:
                    continue
                if bw_n * bh_n < 0.0010 or bw_n * bh_n > 0.85:
                    continue

                detections.append(Detection(
                    class_id=PERSON_CLASS_ID,
                    class_name="person",
                    confidence=float(scores[idx]),
                    bbox=(nx1, ny1, nx2, ny2),
                    center_x=(nx1 + nx2) / 2.0,
                    center_y=(ny1 + ny2) / 2.0
                ))

        return detections

    def track_persons(self, frame: np.ndarray, persist: bool = True) -> List[Detection]:
        """
        Detect persons in frame for robust multi-object tracking.
        Uses ONNXRuntime, OpenCV DNN, or PyTorch YOLO with high accuracy.
        """
        return self.detect_persons(frame)

    def detect_persons(self, frame: np.ndarray) -> List[Detection]:
        """
        Detect persons in a frame with YOLOv11 ONNX, OpenCV DNN, or PyTorch.
        """
        orig_h, orig_w = frame.shape[:2]

        # 1. Try ONNXRuntime
        if hasattr(self, "_ort_session") and self._ort_session is not None:
            try:
                blob, scale, left, top = self._preprocess_onnx(frame)
                out = self._ort_session.run(
                    [self._ort_output_name], {self._ort_input_name: blob}
                )[0]
                return self._postprocess_onnx(out, scale, left, top, orig_w, orig_h)
            except Exception as e:
                logger.error(f"ONNX inference error: {e}")

        # 2. Try OpenCV DNN
        if hasattr(self, "_cv_net") and self._cv_net is not None:
            try:
                blob, scale, left, top = self._preprocess_onnx(frame)
                self._cv_net.setInput(blob)
                out = self._cv_net.forward()
                return self._postprocess_onnx(out, scale, left, top, orig_w, orig_h)
            except Exception as e:
                logger.error(f"cv2.dnn inference error: {e}")

        # 3. Try PyTorch YOLO
        if self._person_model is not None:
            try:
                results = self._person_model.predict(
                    source=frame,
                    conf=self.person_conf,
                    iou=self.iou,
                    classes=[PERSON_CLASS_ID],
                    device=self.device,
                    verbose=False
                )

                detections = []
                for result in results:
                    if result.boxes is None:
                        continue
                    for box in result.boxes:
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        conf = float(box.conf[0])
                        cls_id = int(box.cls[0])

                        nx1, ny1 = x1 / orig_w, y1 / orig_h
                        nx2, ny2 = x2 / orig_w, y2 / orig_h
                        cx = (nx1 + nx2) / 2.0
                        cy = (ny1 + ny2) / 2.0

                        detections.append(Detection(
                            class_id=cls_id,
                            class_name="person",
                            confidence=conf,
                            bbox=(nx1, ny1, nx2, ny2),
                            center_x=cx,
                            center_y=cy
                        ))
                return detections
            except Exception as e:
                logger.error(f"PyTorch YOLO detection failed: {e}")

        # 4. Fallback if no deep learning model available
        return self._detect_persons_fallback(frame)

    def _detect_persons_fallback(self, frame: np.ndarray) -> List[Detection]:
        """
        OpenCV motion and contour fallback person detector.
        Extracts moving figures in retail video frames when PyTorch/YOLO is not available.
        """
        import cv2
        if not hasattr(self, "_bg_subtractor") or self._bg_subtractor is None:
            self._bg_subtractor = cv2.createBackgroundSubtractorMOG2(
                history=300, varThreshold=25, detectShadows=False
            )

        h, w = frame.shape[:2]
        fg_mask = self._bg_subtractor.apply(frame)

        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
        fg_mask = cv2.dilate(fg_mask, kernel, iterations=2)

        contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        min_area = (h * w) * 0.003
        max_area = (h * w) * 0.65

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if min_area <= area <= max_area:
                x, y, bw, bh = cv2.boundingRect(cnt)
                if bh / float(max(bw, 1)) >= 0.7:
                    nx1, ny1 = x / w, y / h
                    nx2, ny2 = (x + bw) / w, (y + bh) / h
                    cx = (nx1 + nx2) / 2
                    cy = (ny1 + ny2) / 2

                    detections.append(Detection(
                        class_id=PERSON_CLASS_ID,
                        class_name="person",
                        confidence=0.72,
                        bbox=(nx1, ny1, nx2, ny2),
                        center_x=cx,
                        center_y=cy
                    ))

        return detections

    def detect_products(self, frame: np.ndarray, shelf_roi: Optional[Tuple] = None) -> List[Detection]:
        """
        Detect retail products in a frame.
        If shelf_roi provided (x1,y1,x2,y2 normalized), crops to ROI first.
        Returns list of Detection objects.
        """
        if self._product_model is None:
            logger.debug("Product model not loaded — skipping product detection")
            return []

        try:
            # Crop to shelf region if ROI defined
            detect_frame = frame
            h, w = frame.shape[:2]
            crop_offset_x, crop_offset_y = 0, 0

            if shelf_roi:
                rx1, ry1, rx2, ry2 = shelf_roi
                px1 = int(rx1 * w)
                py1 = int(ry1 * h)
                px2 = int(rx2 * w)
                py2 = int(ry2 * h)
                detect_frame = frame[py1:py2, px1:px2]
                crop_offset_x, crop_offset_y = px1, py1

            results = self._product_model.predict(
                source=detect_frame,
                conf=self.product_conf,
                iou=self.iou,
                device=self.device,
                verbose=False
            )

            detections = []
            dh, dw = detect_frame.shape[:2]

            for result in results:
                if result.boxes is None:
                    continue
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    conf = float(box.conf[0])
                    cls_id = int(box.cls[0])
                    cls_name = result.names.get(cls_id, f"product_{cls_id}")

                    # Convert back to full-frame coordinates (normalized)
                    fx1 = (x1 + crop_offset_x) / w
                    fy1 = (y1 + crop_offset_y) / h
                    fx2 = (x2 + crop_offset_x) / w
                    fy2 = (y2 + crop_offset_y) / h
                    cx = (fx1 + fx2) / 2
                    cy = (fy1 + fy2) / 2

                    detections.append(Detection(
                        class_id=cls_id,
                        class_name=cls_name,
                        confidence=conf,
                        bbox=(fx1, fy1, fx2, fy2),
                        center_x=cx,
                        center_y=cy
                    ))
            return detections

        except Exception as e:
            logger.error(f"Product detection failed: {e}")
            return []

    def annotate_frame(self, frame: np.ndarray, detections: List[Detection], color=(0, 255, 0)) -> np.ndarray:
        """Draw bounding boxes and labels on frame."""
        import cv2
        annotated = frame.copy()
        h, w = frame.shape[:2]

        for det in detections:
            x1 = int(det.bbox[0] * w)
            y1 = int(det.bbox[1] * h)
            x2 = int(det.bbox[2] * w)
            y2 = int(det.bbox[3] * h)

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            label = f"{det.class_name} {det.confidence:.2f}"
            cv2.putText(annotated, label, (x1, y1 - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        return annotated


# Singleton instance
_detector_instance: Optional[YOLOv11Detector] = None


def get_detector() -> YOLOv11Detector:
    """Get or create the global detector singleton."""
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = YOLOv11Detector()
    return _detector_instance
