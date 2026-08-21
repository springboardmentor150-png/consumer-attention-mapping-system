import math
import numpy as np
from typing import List, Dict, Any

class JourneyAnalyzer:
    def __init__(self):
        pass

    def analyze_path(self, path_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        if not path_data or len(path_data) < 2:
            return {
                "total_distance": 0.0,
                "avg_speed": 0.0,
                "direction_changes": 0,
                "coverage_area": 0.0,
                "point_count": len(path_data) if path_data else 0,
                "path_duration_seconds": 0.0
            }

        total_distance = 0.0
        bearings = []

        for i in range(1, len(path_data)):
            p1, p2 = path_data[i - 1], path_data[i]
            x1, y1 = p1.get("x", 0), p1.get("y", 0)
            x2, y2 = p2.get("x", 0), p2.get("y", 0)
            dist = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
            total_distance += dist

            if dist > 0.01:
                bearing = math.atan2(y2 - y1, x2 - x1)
                bearings.append(bearing)

        # Count direction changes > 45 degrees
        direction_changes = 0
        for i in range(1, len(bearings)):
            diff = abs(math.degrees(bearings[i] - bearings[i - 1]))
            if diff > 180:
                diff = 360 - diff
            if diff > 45:
                direction_changes += 1

        first_t = path_data[0].get("timestamp", 0)
        last_t = path_data[-1].get("timestamp", 0)
        duration = float(last_t - first_t) if last_t > first_t else float(len(path_data))
        avg_speed = round(total_distance / max(duration, 1.0), 2)

        # Calculate bounding box area as proxy for coverage
        xs = [p.get("x", 0) for p in path_data]
        ys = [p.get("y", 0) for p in path_data]
        width = max(xs) - min(xs) if xs else 0
        height = max(ys) - min(ys) if ys else 0
        coverage_area = round(float(width * height), 2)

        return {
            "total_distance": round(total_distance, 2),
            "avg_speed": avg_speed,
            "direction_changes": direction_changes,
            "coverage_area": coverage_area,
            "point_count": len(path_data),
            "path_duration_seconds": round(duration, 2)
        }

    def get_zone_sequence(self, path_data: List[Dict[str, Any]]) -> List[str]:
        seq = []
        last_zone = None
        for p in path_data:
            zid = p.get("zone_id")
            if zid and zid != last_zone:
                seq.append(str(zid))
                last_zone = zid
        return seq

    def get_hotspot_positions(self, path_data: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
        if not path_data:
            return []

        grid: Dict[Tuple[int, int], int] = {}
        for p in path_data:
            gx = int(p.get("x", 0) / 10)
            gy = int(p.get("y", 0) / 10)
            cell = (gx, gy)
            grid[cell] = grid.get(cell, 0) + 1

        sorted_cells = sorted(grid.items(), key=lambda item: item[1], reverse=True)[:top_n]
        hotspots = []
        for (gx, gy), count in sorted_cells:
            hotspots.append({
                "x": gx * 10 + 5,
                "y": gy * 10 + 5,
                "visit_count": count
            })
        return hotspots

    def calculate_path_entropy(self, zone_sequence: List[str]) -> float:
        if not zone_sequence:
            return 0.0

        counts: Dict[str, int] = {}
        for z in zone_sequence:
            counts[z] = counts.get(z, 0) + 1

        total = len(zone_sequence)
        entropy = 0.0
        for cnt in counts.values():
            p = cnt / total
            entropy -= p * math.log2(p)

        # Normalize to 0-1 scale assuming max 10 zones
        max_entropy = math.log2(max(len(counts), 2))
        normalized = entropy / max_entropy if max_entropy > 0 else 0.0
        return round(float(min(1.0, max(0.0, normalized))), 2)
