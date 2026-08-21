import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple

class HeatmapGenerator:
    def __init__(self, width: int = 800, height: int = 600):
        self.width = width
        self.height = height

    def _gaussian_blob(self, array: np.ndarray, cx: int, cy: int, radius: int = 25, intensity: float = 1.0) -> np.ndarray:
        h, w = array.shape[:2]
        y_min = max(0, cy - radius)
        y_max = min(h, cy + radius)
        x_min = max(0, cx - radius)
        x_max = min(w, cx + radius)

        for y in range(y_min, y_max):
            for x in range(x_min, x_max):
                dist_sq = (x - cx) ** 2 + (y - cy) ** 2
                if dist_sq <= radius ** 2:
                    val = intensity * np.exp(-dist_sq / (2 * (radius / 2) ** 2))
                    array[y, x] += val
        return array

    def generate_traffic_heatmap(self, coordinate_points: List[Dict[str, float]], output_path: str) -> str:
        acc = np.zeros((self.height, self.width), dtype=np.float32)

        if not coordinate_points:
            cv2.putText(acc, "No Traffic Data", (self.width // 4, self.height // 2),
                        cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255, 255, 255), 2)
        else:
            for pt in coordinate_points:
                cx = int((pt.get("x", 0) / 100.0) * self.width) if pt.get("x", 0) <= 100 else int(pt.get("x", 0))
                cy = int((pt.get("y", 0) / 100.0) * self.height) if pt.get("y", 0) <= 100 else int(pt.get("y", 0))
                cx = max(0, min(self.width - 1, cx))
                cy = max(0, min(self.height - 1, cy))
                self._gaussian_blob(acc, cx, cy, radius=30, intensity=1.0)

        # Normalize accumulator
        max_val = np.max(acc)
        if max_val > 0:
            norm = np.uint8(np.clip((acc / max_val) * 255, 0, 255))
        else:
            norm = np.zeros((self.height, self.width), dtype=np.uint8)

        # Apply Jet colormap
        heatmap_color = cv2.applyColorMap(norm, cv2.COLORMAP_JET)

        # Ensure destination folder exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, heatmap_color)
        return output_path

    def generate_attention_heatmap(self, attention_events: List[Any], shelf_coordinates: Dict[str, Any], output_path: str) -> str:
        acc = np.zeros((self.height, self.width), dtype=np.float32)

        for event in attention_events:
            gx = getattr(event, "gaze_x", 0.0) or 0.0
            gy = getattr(event, "gaze_y", 0.0) or 0.0
            dur = getattr(event, "attention_duration_seconds", 1.0) or 1.0

            cx = int((gx / 100.0) * self.width) if gx <= 100 else int(gx)
            cy = int((gy / 100.0) * self.height) if gy <= 100 else int(gy)
            cx = max(0, min(self.width - 1, cx))
            cy = max(0, min(self.height - 1, cy))

            self._gaussian_blob(acc, cx, cy, radius=25, intensity=dur)

        max_val = np.max(acc)
        norm = np.uint8(np.clip((acc / max_val) * 255, 0, 255)) if max_val > 0 else np.zeros((self.height, self.width), dtype=np.uint8)
        heatmap_color = cv2.applyColorMap(norm, cv2.COLORMAP_JET)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, heatmap_color)
        return output_path

    def generate_dwell_heatmap(self, dwell_records: List[Any], output_path: str) -> str:
        acc = np.zeros((self.height, self.width), dtype=np.float32)

        for rec in dwell_records:
            sec = getattr(rec, "dwell_seconds", 1.0) or 1.0
            # Synthesize coordinate center for dwell record
            cx = self.width // 2
            cy = self.height // 2
            self._gaussian_blob(acc, cx, cy, radius=40, intensity=sec)

        max_val = np.max(acc)
        norm = np.uint8(np.clip((acc / max_val) * 255, 0, 255)) if max_val > 0 else np.zeros((self.height, self.width), dtype=np.uint8)
        heatmap_color = cv2.applyColorMap(norm, cv2.COLORMAP_JET)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, heatmap_color)
        return output_path

    def overlay_on_store_image(self, heatmap_array: np.ndarray, store_image_path: str) -> np.ndarray:
        if not os.path.exists(store_image_path):
            return heatmap_array

        store_img = cv2.imread(store_image_path)
        if store_img is None:
            return heatmap_array

        store_img = cv2.resize(store_img, (self.width, self.height))
        blended = cv2.addWeighted(heatmap_array, 0.6, store_img, 0.4, 0)
        return blended
