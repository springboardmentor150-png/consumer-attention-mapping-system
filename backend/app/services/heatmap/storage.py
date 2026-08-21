import os
import glob
import cv2
import numpy as np
from datetime import datetime
from typing import Tuple

class HeatmapStorage:
    def __init__(self, base_path: str = "static/heatmaps"):
        self.base_path = base_path

    def ensure_directories(self):
        os.makedirs(self.base_path, exist_ok=True)

    def generate_filename(self, store_id: str, heatmap_type: str, period_start: datetime) -> str:
        s_id = str(store_id)[:8]
        ts_str = period_start.strftime("%Y%m%d_%H%M%S")
        return f"heatmap_{s_id}_{heatmap_type}_{ts_str}.png"

    def save_heatmap(self, image_array: np.ndarray, store_id: str, heatmap_type: str, period_start: datetime) -> Tuple[str, str]:
        self.ensure_directories()
        filename = self.generate_filename(store_id, heatmap_type, period_start)
        full_path = os.path.join(self.base_path, filename)
        cv2.imwrite(full_path, image_array)
        return full_path, filename

    def get_image_url(self, file_name: str, base_url: str = "http://localhost:8000") -> str:
        return f"{base_url}/static/heatmaps/{file_name}"

    def delete_old_heatmaps(self, store_id: str, heatmap_type: str, keep_latest: int = 5):
        s_id = str(store_id)[:8]
        pattern = os.path.join(self.base_path, f"heatmap_{s_id}_{heatmap_type}_*.png")
        files = glob.glob(pattern)
        files.sort(key=os.path.getmtime, reverse=True)
        for old_f in files[keep_latest:]:
            try:
                os.remove(old_f)
            except Exception:
                pass
