from uuid import UUID
from typing import List, Dict, Any

class ShelfVisibilityScorer:
    def score_shelf(self, shelf_id: UUID, shelf_level: int, zone_traffic: int, camera_coverage: bool) -> float:
        base_score = 100.0

        if shelf_level == 0:  # floor level penalty
            base_score -= 20.0
        elif shelf_level == 1:  # eye level optimal
            base_score += 0.0
        elif shelf_level >= 3:  # high shelf penalty
            base_score -= 15.0

        if zone_traffic < 10:
            base_score -= 10.0

        if not camera_coverage:
            base_score -= 25.0

        return max(0.0, min(100.0, base_score))

    def score_all_shelves(self, shelves: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        for s in shelves:
            score = self.score_shelf(
                shelf_id=s["shelf_id"],
                shelf_level=s.get("shelf_level", 1),
                zone_traffic=s.get("zone_traffic", 20),
                camera_coverage=s.get("camera_coverage", True)
            )
            results.append({
                "shelf_id": s["shelf_id"],
                "visibility_score": score,
                "shelf_level": s.get("shelf_level", 1),
                "grade": self.get_visibility_grade(score)
            })
        return results

    def get_visibility_grade(self, score: float) -> str:
        if score >= 80.0:
            return "A"
        elif score >= 65.0:
            return "B"
        elif score >= 50.0:
            return "C"
        elif score >= 35.0:
            return "D"
        else:
            return "F"
