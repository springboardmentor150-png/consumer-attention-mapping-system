from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.dwell_time import DwellTimeRecord
from app.models.attention_event import AttentionEvent

async def save_dwell_record(
    db: AsyncSession,
    session_id: str,
    tracker_id: int,
    entry_timestamp: datetime,
    exit_timestamp: datetime,
    dwell_seconds: float,
    store_id: str,
    camera_id: str,
    shelf_id: Optional[str] = None,
    zone_id: Optional[str] = None
) -> DwellTimeRecord:
    """Save a completed shopper dwell time record to the PostgreSQL database."""
    record = DwellTimeRecord(
        session_id=session_id,
        store_id=store_id,
        camera_id=camera_id,
        shelf_id=shelf_id,
        zone_id=zone_id,
        tracker_id=tracker_id,
        entry_timestamp=entry_timestamp,
        exit_timestamp=exit_timestamp,
        dwell_seconds=dwell_seconds,
        is_complete=True
    )
    db.add(record)
    await db.commit()
    return record

async def save_attention_event(
    db: AsyncSession,
    session_id: str,
    camera_id: str,
    event_type: str,
    attention_duration_seconds: float,
    is_looking_at_shelf: bool,
    head_yaw: Optional[float] = None,
    head_pitch: Optional[float] = None,
    head_roll: Optional[float] = None,
    shelf_id: Optional[str] = None,
    zone_id: Optional[str] = None
) -> AttentionEvent:
    """Save a shopper shelf attention event to the PostgreSQL database."""
    event = AttentionEvent(
        session_id=session_id,
        camera_id=camera_id,
        shelf_id=shelf_id,
        zone_id=zone_id,
        event_type=event_type,
        attention_duration_seconds=attention_duration_seconds,
        is_looking_at_shelf=is_looking_at_shelf,
        head_yaw=head_yaw,
        head_pitch=head_pitch,
        head_roll=head_roll
    )
    db.add(event)
    await db.commit()
    return event

def format_console_log(tracker_id: int, dwell_seconds: float, is_looking: bool, head_yaw: Optional[float] = None) -> str:
    """Format console output matching the evaluation criteria."""
    looking_str = "Yes" if is_looking else "No"
    yaw_str = f"{head_yaw:.1f}°" if head_yaw is not None else "N/A"
    return f"Shopper #{tracker_id} | Dwell: {dwell_seconds:.1f}s | Looking at shelf: {looking_str} | Yaw: {yaw_str}"
