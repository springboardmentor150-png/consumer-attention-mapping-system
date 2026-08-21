import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.camera import Camera, CameraStatus
from app.schemas.camera import CameraCreate, CameraUpdate

class CameraService:
    @staticmethod
    async def create_camera(db: AsyncSession, camera_in: CameraCreate) -> Camera:
        """Create a new camera mapping."""
        db_camera = Camera(
            store_id=camera_in.store_id,
            zone_id=camera_in.zone_id,
            shelf_id=camera_in.shelf_id,
            name=camera_in.name,
            camera_type=camera_in.camera_type,
            rtsp_url=camera_in.rtsp_url,
            ip_address=camera_in.ip_address,
            location_description=camera_in.location_description,
            mount_height_cm=camera_in.mount_height_cm,
            field_of_view_degrees=camera_in.field_of_view_degrees,
            resolution=camera_in.resolution,
            fps=camera_in.fps,
            status=camera_in.status
        )
        db.add(db_camera)
        await db.commit()
        await db.refresh(db_camera)
        return db_camera

    @staticmethod
    async def get_camera_by_id(db: AsyncSession, camera_id: uuid.UUID) -> Optional[Camera]:
        """Fetch a single camera by ID."""
        result = await db.execute(select(Camera).where(Camera.id == camera_id))
        return result.scalars().first()

    @staticmethod
    async def get_cameras_by_store(db: AsyncSession, store_id: uuid.UUID) -> List[Camera]:
        """Retrieve all cameras configured in a store."""
        result = await db.execute(select(Camera).where(Camera.store_id == store_id))
        return list(result.scalars().all())

    @staticmethod
    async def update_camera(db: AsyncSession, camera_id: uuid.UUID, camera_in: CameraUpdate) -> Optional[Camera]:
        """Update camera settings."""
        db_camera = await CameraService.get_camera_by_id(db, camera_id)
        if not db_camera:
            return None

        update_data = camera_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_camera, key, value)

        await db.commit()
        await db.refresh(db_camera)
        return db_camera

    @staticmethod
    async def delete_camera(db: AsyncSession, camera_id: uuid.UUID) -> bool:
        """Delete a camera registration."""
        db_camera = await CameraService.get_camera_by_id(db, camera_id)
        if not db_camera:
            return False
        await db.delete(db_camera)
        await db.commit()
        return True

    @staticmethod
    async def update_status(db: AsyncSession, camera_id: uuid.UUID, status: CameraStatus) -> Optional[Camera]:
        """Update camera operational status."""
        db_camera = await CameraService.get_camera_by_id(db, camera_id)
        if not db_camera:
            return None
        db_camera.status = status
        await db.commit()
        await db.refresh(db_camera)
        return db_camera

    @staticmethod
    async def update_heartbeat(db: AsyncSession, camera_id: uuid.UUID) -> Optional[Camera]:
        """Record a heartbeat timestamp for the camera."""
        db_camera = await CameraService.get_camera_by_id(db, camera_id)
        if not db_camera:
            return None
        db_camera.last_heartbeat = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(db_camera)
        return db_camera

    @staticmethod
    async def get_camera_health(db: AsyncSession, camera_id: uuid.UUID) -> Optional[dict]:
        """Analyze a camera's connectivity based on its status and heartbeat timestamp."""
        camera = await CameraService.get_camera_by_id(db, camera_id)
        if not camera:
            return None

        is_online = False
        if camera.status == CameraStatus.active and camera.last_heartbeat:
            # Consider online if last heartbeat was received within 5 minutes (300s)
            diff = datetime.now(timezone.utc) - camera.last_heartbeat
            if diff.total_seconds() < 300:
                is_online = True

        return {
            "camera_id": camera.id,
            "name": camera.name,
            "status": camera.status,
            "last_heartbeat": camera.last_heartbeat.isoformat() if camera.last_heartbeat else None,
            "is_online": is_online,
            "rtsp_url": camera.rtsp_url,
            "ip_address": camera.ip_address
        }
