import hashlib
import time
from datetime import datetime, timezone
from uuid import UUID
from typing import Dict, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.shopper_session import ShopperSession

class SessionManager:
    def __init__(self, db: AsyncSession):
        self.db = db
        # Maps tracker_id (int) -> session_id (str)
        self._active_map: Dict[int, str] = {}

    async def create_session(self, store_id: str, camera_id: str, tracker_id: int) -> ShopperSession:
        """Create a new ShopperSession in the database."""
        # Create an anonymous ID using SHA-256 hash
        now = datetime.now(timezone.utc)
        raw_str = f"{tracker_id}-{now.timestamp()}-{time.time_ns()}"
        anonymous_id = hashlib.sha256(raw_str.encode()).hexdigest()[:16]
        
        session = ShopperSession(
            store_id=store_id,
            camera_id=camera_id,
            anonymous_id=anonymous_id,
            entry_time=now,
            is_active=True
        )
        self.db.add(session)
        await self.db.flush()
        
        self._active_map[tracker_id] = session.id
        return session

    async def close_session(self, tracker_id: int, dwell_seconds: float) -> None:
        """Close an active ShopperSession in the database."""
        if tracker_id not in self._active_map:
            return
            
        session_id = self._active_map[tracker_id]
        
        result = await self.db.execute(select(ShopperSession).where(ShopperSession.id == session_id))
        session = result.scalar_one_or_none()
        
        if session:
            session.exit_time = datetime.now(timezone.utc)
            session.total_dwell_time_seconds = dwell_seconds
            session.is_active = False
            await self.db.flush()
            
        self._active_map.pop(tracker_id, None)

    async def get_session_id(self, tracker_id: int) -> Optional[str]:
        """Get the active session ID for a tracker ID."""
        return self._active_map.get(tracker_id)

    def get_active_count(self) -> int:
        """Get the number of active shopper sessions."""
        return len(self._active_map)

    def get_all_active_tracker_ids(self) -> List[int]:
        """Get all active tracker IDs."""
        return list(self._active_map.keys())
