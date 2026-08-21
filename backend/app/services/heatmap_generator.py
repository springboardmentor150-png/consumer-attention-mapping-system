"""
Heatmap Generator Service
Generates multiple types of attention/traffic heatmaps from PostgreSQL data.
Types: traffic, attention, product, zone
"""

import logging
import numpy as np
import cv2
from typing import Optional, List, Tuple, Dict
from sqlalchemy.orm import Session
from ..models import TrackingPoint, AttentionEvent, ShopperSession

logger = logging.getLogger(__name__)

HEATMAP_WIDTH = 160
HEATMAP_HEIGHT = 120
HEATMAP_BLUR_RADIUS = 15


class HeatmapGenerator:
    """Generates normalized heatmaps from PostgreSQL tracking/attention data."""

    def generate_traffic_heatmap(
        self,
        db: Session,
        store_id: str,
        video_ids: Optional[List[str]] = None,
        width: int = HEATMAP_WIDTH,
        height: int = HEATMAP_HEIGHT
    ) -> Dict:
        """
        Generate shopper traffic heatmap from tracking points.
        Returns grid of normalized intensity values.
        """
        grid = np.zeros((height, width), dtype=np.float32)

        # Query tracking points
        query = db.query(TrackingPoint).join(
            ShopperSession, TrackingPoint.session_id == ShopperSession.session_id
        )
        if video_ids:
            query = query.filter(ShopperSession.video_id.in_(video_ids))

        points = query.all()

        for point in points:
            px = int(point.x * width)
            py = int(point.y * height)
            px = min(max(px, 0), width - 1)
            py = min(max(py, 0), height - 1)
            grid[py, px] += 1.0

        return self._finalize_heatmap(grid, "traffic", store_id, width, height)

    def generate_attention_heatmap(
        self,
        db: Session,
        store_id: str,
        video_ids: Optional[List[str]] = None,
        width: int = HEATMAP_WIDTH,
        height: int = HEATMAP_HEIGHT
    ) -> Dict:
        """
        Generate attention heatmap weighted by attention duration.
        Attention events are mapped to shelf coordinates.
        """
        from ..models import Shelf
        grid = np.zeros((height, width), dtype=np.float32)

        # Load shelf coordinates for this store
        shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
        shelf_coords = {
            str(s.shelf_id): s.coordinates
            for s in shelves if s.coordinates
        }

        # Query attention events
        query = db.query(AttentionEvent).join(
            ShopperSession, AttentionEvent.session_id == ShopperSession.session_id
        )
        if video_ids:
            query = query.filter(ShopperSession.video_id.in_(video_ids))

        events = query.all()

        for event in events:
            shelf_id = str(event.shelf_id) if event.shelf_id else None
            duration = event.duration or 0.0

            if shelf_id and shelf_id in shelf_coords:
                coords = shelf_coords[shelf_id]
                cx = (coords.get("x1", 0) + coords.get("x2", 1)) / 2
                cy = (coords.get("y1", 0) + coords.get("y2", 1)) / 2
            else:
                cx, cy = 0.5, 0.5

            px = int(cx * width)
            py = int(cy * height)
            px = min(max(px, 0), width - 1)
            py = min(max(py, 0), height - 1)
            grid[py, px] += duration

        # Fallback to tracking point density if direct attention events are empty
        if not events:
            tp_query = db.query(TrackingPoint).join(
                ShopperSession, TrackingPoint.session_id == ShopperSession.session_id
            )
            if video_ids:
                tp_query = tp_query.filter(ShopperSession.video_id.in_(video_ids))
            for tp in tp_query.all():
                px = min(max(int(tp.x * width), 0), width - 1)
                py = min(max(int(tp.y * height), 0), height - 1)
                grid[py, px] += 0.5

        return self._finalize_heatmap(grid, "attention", store_id, width, height)

    def generate_zone_heatmap(
        self,
        db: Session,
        store_id: str,
        video_ids: Optional[List[str]] = None,
        width: int = HEATMAP_WIDTH,
        height: int = HEATMAP_HEIGHT
    ) -> Dict:
        """Generate zone-level traffic heatmap based on dwell times."""
        from ..models import StoreZone
        grid = np.zeros((height, width), dtype=np.float32)

        zones = db.query(StoreZone).filter(StoreZone.store_id == store_id).all()

        sessions_query = db.query(ShopperSession)
        if video_ids:
            sessions_query = sessions_query.filter(ShopperSession.video_id.in_(video_ids))
        sessions = sessions_query.all()

        # Aggregate dwell time per zone
        zone_dwell: Dict[str, float] = {}
        for session in sessions:
            if not session.zones_visited:
                continue
            for zone_info in session.zones_visited:
                zid = zone_info.get("zone_id")
                dwell = zone_info.get("dwell", 0.0)
                if zid:
                    zone_dwell[zid] = zone_dwell.get(zid, 0.0) + dwell

        # Map to grid
        for zone in zones:
            coords = zone.coordinates
            if not coords:
                continue
            zid = str(zone.zone_id)
            dwell = zone_dwell.get(zid, 0.0)
            if dwell == 0:
                dwell = 1.0  # Show base region for zone

            x1 = int(coords.get("x1", 0) * width)
            y1 = int(coords.get("y1", 0) * height)
            x2 = int(coords.get("x2", 1) * width)
            y2 = int(coords.get("y2", 1) * height)
            grid[y1:y2, x1:x2] += dwell

        return self._finalize_heatmap(grid, "zone", store_id, width, height)

    def generate_product_heatmap(
        self,
        db: Session,
        store_id: str,
        video_ids: Optional[List[str]] = None,
        width: int = HEATMAP_WIDTH,
        height: int = HEATMAP_HEIGHT
    ) -> Dict:
        """Generate product attention heatmap."""
        from ..models import Product, Shelf
        grid = np.zeros((height, width), dtype=np.float32)

        shelf_coords = {}
        shelves = db.query(Shelf).filter(Shelf.store_id == store_id).all()
        for s in shelves:
            if s.coordinates:
                shelf_coords[str(s.shelf_id)] = s.coordinates

        query = db.query(AttentionEvent).join(
            ShopperSession, AttentionEvent.session_id == ShopperSession.session_id
        ).filter(AttentionEvent.product_id.isnot(None))
        if video_ids:
            query = query.filter(ShopperSession.video_id.in_(video_ids))

        events = query.all()
        for event in events:
            shelf_id = str(event.shelf_id) if event.shelf_id else None
            duration = event.duration or 1.0
            if shelf_id and shelf_id in shelf_coords:
                coords = shelf_coords[shelf_id]
                cx = (coords.get("x1", 0) + coords.get("x2", 1)) / 2
                cy = (coords.get("y1", 0) + coords.get("y2", 1)) / 2
                px = min(max(int(cx * width), 0), width - 1)
                py = min(max(int(cy * height), 0), height - 1)
                grid[py, px] += duration

        if not events:
            tp_query = db.query(TrackingPoint).join(
                ShopperSession, TrackingPoint.session_id == ShopperSession.session_id
            )
            if video_ids:
                tp_query = tp_query.filter(ShopperSession.video_id.in_(video_ids))
            for tp in tp_query.all():
                px = min(max(int(tp.x * width), 0), width - 1)
                py = min(max(int(tp.y * height), 0), height - 1)
                grid[py, px] += 0.4

        return self._finalize_heatmap(grid, "product", store_id, width, height)

    def _finalize_heatmap(
        self,
        grid: np.ndarray,
        heatmap_type: str,
        store_id: str,
        width: int,
        height: int
    ) -> Dict:
        """Apply Gaussian blur and normalize heatmap grid."""
        # Apply Gaussian blur for smooth heatmap
        blurred = cv2.GaussianBlur(grid, (HEATMAP_BLUR_RADIUS, HEATMAP_BLUR_RADIUS), 0)

        max_val = float(blurred.max())
        if max_val > 0:
            normalized = blurred / max_val
        else:
            normalized = blurred

        # Convert to Python list for JSON serialization
        grid_list = normalized.tolist()

        return {
            "store_id": store_id,
            "heatmap_type": heatmap_type,
            "grid": grid_list,
            "width": width,
            "height": height,
            "max_value": max_val,
            "generated_at": __import__("datetime").datetime.utcnow().isoformat()
        }

    def generate_heatmap_image(self, grid_data: List[List[float]]) -> bytes:
        """
        Convert grid to colored heatmap image (PNG bytes).
        Uses OpenCV JET colormap.
        """
        grid = np.array(grid_data, dtype=np.float32)
        grid_uint8 = (grid * 255).astype(np.uint8)
        colored = cv2.applyColorMap(grid_uint8, cv2.COLORMAP_JET)
        _, buffer = cv2.imencode(".png", colored)
        return buffer.tobytes()


_generator: Optional[HeatmapGenerator] = None


def get_heatmap_generator() -> HeatmapGenerator:
    global _generator
    if _generator is None:
        _generator = HeatmapGenerator()
    return _generator
