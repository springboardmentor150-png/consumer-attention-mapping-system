from datetime import datetime, timezone
from typing import Dict, List, Optional, Any

class DwellCalculator:
    def __init__(self):
        # Maps tracker_id (int) -> dict with entry_time, last_seen, shelf_id, zone_id
        self._active_dwells: Dict[int, Dict[str, Any]] = {}

    def start_dwell(self, tracker_id: int, shelf_id: Optional[str] = None, zone_id: Optional[str] = None) -> None:
        """Start tracking dwell time for a shopper."""
        if tracker_id not in self._active_dwells:
            now = datetime.now(timezone.utc)
            self._active_dwells[tracker_id] = {
                "entry_time": now,
                "last_seen": now,
                "shelf_id": shelf_id,
                "zone_id": zone_id
            }

    def update_dwell(self, tracker_id: int) -> None:
        """Update last seen timestamp for a shopper."""
        if tracker_id in self._active_dwells:
            self._active_dwells[tracker_id]["last_seen"] = datetime.now(timezone.utc)

    def end_dwell(self, tracker_id: int) -> Optional[Dict[str, Any]]:
        """End tracking dwell time for a shopper and return the completed record."""
        if tracker_id not in self._active_dwells:
            return None
            
        record = self._active_dwells.pop(tracker_id)
        exit_time = datetime.now(timezone.utc)
        dwell_seconds = (exit_time - record["entry_time"]).total_seconds()
        
        return {
            "tracker_id": tracker_id,
            "entry_time": record["entry_time"],
            "exit_time": exit_time,
            "dwell_seconds": round(dwell_seconds, 2),
            "shelf_id": record["shelf_id"],
            "zone_id": record["zone_id"]
        }

    def get_current_dwell(self, tracker_id: int) -> float:
        """Get current dwell time in seconds for an active shopper."""
        if tracker_id not in self._active_dwells:
            return 0.0
        elapsed = (datetime.now(timezone.utc) - self._active_dwells[tracker_id]["entry_time"]).total_seconds()
        return round(elapsed, 2)

    def get_all_active(self) -> Dict[int, float]:
        """Get current dwell times for all active shoppers."""
        return {tid: self.get_current_dwell(tid) for tid in self._active_dwells}

    def cleanup_lost_trackers(self, active_tracker_ids: List[int]) -> List[Dict[str, Any]]:
        """Clean up and return completed records for shoppers who are no longer active."""
        completed = []
        for tid in list(self._active_dwells.keys()):
            if tid not in active_tracker_ids:
                record = self.end_dwell(tid)
                if record:
                    completed.append(record)
        return completed
