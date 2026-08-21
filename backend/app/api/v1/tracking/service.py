from datetime import datetime, timezone
from uuid import UUID
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.tracking_session import TrackingSession
from app.models.shopper_session import ShopperSession
from app.schemas.tracking import TrackingSessionCreate

class TrackingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_tracking_session(self, schema: TrackingSessionCreate) -> TrackingSession:
        """Create and start a new video tracking session record."""
        session = TrackingSession(
            camera_id=str(schema.camera_id),
            store_id=str(schema.store_id),
            video_source=schema.video_source,
            status="running",
            started_at=datetime.now(timezone.utc)
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_tracking_session(self, session_id: UUID) -> TrackingSession:
        """Retrieve a tracking session by ID."""
        result = await self.db.execute(select(TrackingSession).where(TrackingSession.id == str(session_id)))
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tracking session with ID {session_id} not found."
            )
        return session

    async def list_tracking_sessions(
        self, store_id: Optional[UUID] = None, status_filter: Optional[str] = None, skip: int = 0, limit: int = 20
    ) -> List[TrackingSession]:
        """List tracking sessions with optional store and status filters."""
        stmt = select(TrackingSession)
        if store_id:
            stmt = stmt.where(TrackingSession.store_id == str(store_id))
        if status_filter:
            stmt = stmt.where(TrackingSession.status == status_filter)
            
        stmt = stmt.offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def stop_tracking_session(self, session_id: UUID) -> TrackingSession:
        """Stop a running tracking session."""
        session = await self.get_tracking_session(session_id)
        if session.status == "running":
            session.status = "stopped"
            session.ended_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(session)
        return session

    async def get_active_shopper_sessions(self, store_id: UUID) -> List[dict]:
        """Fetch active shopper sessions and calculate current accumulated dwell times."""
        stmt = select(ShopperSession).where(
            ShopperSession.store_id == str(store_id),
            ShopperSession.is_active == True
        )
        res = await self.db.execute(stmt)
        sessions = res.scalars().all()
        
        active_shoppers = []
        now = datetime.now(timezone.utc)
        for s in sessions:
            # Calculate current elapsed dwell duration
            curr_dwell = (now - s.entry_time).total_seconds()
            
            # Extract tracker_id from anonymous_id if possible, or fallback to hash-value
            try:
                # If we parsed it from format, fallback to standard integer values
                tracker_id = int(s.anonymous_id.split("-")[0])
            except Exception:
                # Use standard hash integer fallback
                tracker_id = hash(s.anonymous_id) % 10000
                
            active_shoppers.append({
                "tracker_id": tracker_id,
                "current_dwell_seconds": round(curr_dwell, 2),
                "is_looking_at_shelf": False,  # default placeholder, updated dynamically
                "head_yaw": None
            })
            
        return active_shoppers
