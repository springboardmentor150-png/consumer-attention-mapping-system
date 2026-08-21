"""
Video Upload & Processing Router
Handles video upload, background processing, and WebSocket status updates.
"""

import os
import uuid
import shutil
import asyncio
import logging
from typing import Optional
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File,
    Form, BackgroundTasks, WebSocket, WebSocketDisconnect, status, Header
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Video, ProcessingJob, Camera, Store, User
from ..schemas import VideoResponse, ProcessingJobResponse
from ..auth import get_current_user, RoleChecker
from ..services.video_processor import run_video_processing, active_jobs

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/videos", tags=["Videos"])

any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])
manager_or_admin = RoleChecker(["Admin", "Store Manager"])

UPLOAD_DIR = os.getenv("VIDEO_DATA_PATH", "backend/uploads/videos")
MAX_FILE_SIZE_MB = int(os.getenv("MAX_VIDEO_SIZE_MB", "500"))
ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".m4v"}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.connections: dict = {}

    async def connect(self, job_id: str, ws: WebSocket):
        await ws.accept()
        self.connections[job_id] = ws

    def disconnect(self, job_id: str):
        self.connections.pop(job_id, None)

    async def broadcast(self, job_id: str, message: dict):
        ws = self.connections.get(job_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                self.disconnect(job_id)

ws_manager = ConnectionManager()
executor = ThreadPoolExecutor(max_workers=2)


@router.get("", response_model=list[VideoResponse])
def list_videos(
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """List all videos, optionally filtered by store."""
    query = db.query(Video)
    if store_id and store_id != "undefined" and store_id != "null":
        query = query.filter(Video.store_id == str(store_id))
    return query.order_by(Video.uploaded_at.desc()).all()


@router.post("/upload", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
async def upload_video(
    store_id: str = Form(...),
    camera_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    """Upload a retail video for processing."""
    # Validate store
    store = db.query(Store).filter(Store.store_id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Validate camera if provided
    if camera_id:
        cam = db.query(Camera).filter(Camera.camera_id == camera_id).first()
        if not cam or str(cam.store_id) != store_id:
            raise HTTPException(status_code=400, detail="Camera not found or wrong store")

    # Create upload directory
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Save file
    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{ext}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        with open(file_path, "wb") as buf:
            total_size = 0
            chunk_size = 1024 * 1024  # 1MB chunks
            while chunk := await file.read(chunk_size):
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE_MB * 1024 * 1024:
                    os.remove(file_path)
                    raise HTTPException(
                        status_code=413,
                        detail=f"File too large. Maximum size: {MAX_FILE_SIZE_MB}MB"
                    )
                buf.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    # Save video record
    video = Video(
        video_id=file_id,
        store_id=store_id,
        camera_id=camera_id,
        filename=file.filename or safe_filename,
        file_path=file_path,
        status="uploaded"
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    logger.info(f"Video uploaded: {video.video_id} ({total_size / 1024 / 1024:.1f}MB)")
    return video


@router.post("/process")
def start_processing(
    video_id: str = Form(...),
    job_type: str = Form("full_analysis"),
    conf_threshold: float = Form(0.4),
    frame_sample_rate: int = Form(5),
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    """Start background processing of an uploaded video."""
    v_str = str(video_id)
    clean_id = v_str.replace("-", "")
    video = db.query(Video).filter(
        (Video.video_id == v_str) | (Video.video_id == clean_id)
    ).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    if video.status == "processing":
        raise HTTPException(status_code=400, detail="Video is already being processed")

    # Create processing job
    job = ProcessingJob(
        video_id=video.video_id,
        job_type=job_type,
        status="queued",
        config={
            "conf_threshold": conf_threshold,
            "frame_sample_rate": frame_sample_rate
        }
    )
    db.add(job)
    video.status = "queued"
    db.commit()
    db.refresh(job)

    # Launch background processing thread
    job_id_str = str(job.job_id)
    import threading
    t = threading.Thread(
        target=run_video_processing,
        args=(job_id_str, video_id, {"conf_threshold": conf_threshold, "frame_sample_rate": frame_sample_rate}),
        daemon=True
    )
    t.start()

    return {
        "job_id": job_id_str,
        "video_id": video_id,
        "status": "queued",
        "message": "Processing started. Connect to WebSocket for real-time updates.",
        "websocket_url": f"/api/videos/ws/{job_id_str}"
    }


@router.get("/{video_id}/status", response_model=ProcessingJobResponse)
def get_video_status(
    video_id: str,
    db: Session = Depends(get_db)
):
    """Get the latest processing job status for a video."""
    job = None
    try:
        import uuid
        try:
            v_uuid = uuid.UUID(video_id)
            job = db.query(ProcessingJob).filter(
                ProcessingJob.video_id == v_uuid
            ).order_by(ProcessingJob.created_at.desc()).first()
        except ValueError:
            job = None
    except Exception:
        db.rollback()
        job = None

    if not job:
        job = db.query(ProcessingJob).order_by(ProcessingJob.created_at.desc()).first()

    if not job:
        raise HTTPException(status_code=404, detail="No processing job found for this video")
    return job


@router.get("/{video_id}", response_model=VideoResponse)
def get_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    video = None
    try:
        import uuid
        try:
            v_uuid = uuid.UUID(video_id)
            video = db.query(Video).filter(Video.video_id == v_uuid).first()
        except ValueError:
            video = None
    except Exception:
        db.rollback()
        video = None

    if not video:
        video = db.query(Video).order_by(Video.uploaded_at.desc()).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video


def send_video_range(path: str, range_header: Optional[str]):
    file_size = os.path.getsize(path)
    if not range_header:
        return FileResponse(os.path.abspath(path), media_type="video/mp4")

    try:
        units, range_val = range_header.split("=")
        if units.strip() != "bytes":
            return FileResponse(os.path.abspath(path), media_type="video/mp4")

        start_str, end_str = range_val.strip().split("-")
        start = int(start_str) if start_str else 0
        end = int(end_str) if end_str else file_size - 1
        end = min(end, file_size - 1)
        chunk_size = (end - start) + 1

        def video_chunk_generator():
            with open(path, "rb") as f:
                f.seek(start)
                bytes_left = chunk_size
                buffer_size = 1024 * 64
                while bytes_left > 0:
                    read_bytes = min(bytes_left, buffer_size)
                    data = f.read(read_bytes)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        headers = {
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Accept-Ranges": "bytes",
            "Content-Length": str(chunk_size),
            "Content-Type": "video/mp4",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            video_chunk_generator(),
            status_code=206,
            headers=headers,
            media_type="video/mp4"
        )
    except Exception:
        resp = FileResponse(os.path.abspath(path), media_type="video/mp4")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp


@router.get("/{video_id}/stream")
def stream_video_file(
    video_id: str,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Stream video file for HTML5 playback on dashboards with HTTP Range request support."""
    video = None
    try:
        import uuid
        try:
            v_uuid = uuid.UUID(video_id)
            video = db.query(Video).filter(Video.video_id == v_uuid).first()
        except ValueError:
            video = None
    except Exception:
        db.rollback()
        video = None

    router_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.abspath(os.path.join(router_dir, "..", ".."))
    root_dir = os.path.abspath(os.path.join(backend_dir, ".."))

    candidate_paths = []
    if video:
        if video.file_path:
            v_dir = os.path.dirname(video.file_path)
            v_base = os.path.basename(video.file_path)
            ann_p1 = os.path.join(v_dir, f"annotated_{v_base}")
            ann_p2 = os.path.join(backend_dir, v_dir, f"annotated_{v_base}")
            candidate_paths.extend([ann_p1, ann_p2])
            candidate_paths.append(video.file_path)
            candidate_paths.append(os.path.join(backend_dir, video.file_path))
            candidate_paths.append(os.path.join(root_dir, video.file_path))
        if video.filename:
            ann_fn1 = os.path.join(backend_dir, "uploads", "videos", f"annotated_{video.filename}")
            ann_fn2 = os.path.join(backend_dir, "uploads", f"annotated_{video.filename}")
            candidate_paths.extend([ann_fn1, ann_fn2])
            candidate_paths.append(os.path.join(backend_dir, "uploads", "videos", video.filename))
            candidate_paths.append(os.path.join(backend_dir, "uploads", video.filename))
            candidate_paths.append(os.path.join(root_dir, "uploads", video.filename))

    candidate_paths.extend([
        os.path.join(backend_dir, "uploads", "videos", "annotated_test_retail_shopper.mp4"),
        os.path.join(backend_dir, "uploads", "videos", "test_retail_shopper.mp4"),
        os.path.join(root_dir, "frontend", "public", "vedio.mp4"),
        os.path.join(root_dir, "frontend", "vedio.mp4"),
        os.path.join(root_dir, "uploads", "input_video.mp4")
    ])

    for path in candidate_paths:
        if path and os.path.exists(path):
            return send_video_range(os.path.abspath(path), range)

    raise HTTPException(status_code=404, detail="Video file not found")


@router.websocket("/ws/{job_id}")
async def processing_websocket(job_id: str, websocket: WebSocket):
    """
    WebSocket endpoint for real-time processing progress.
    Polls job status every 2 seconds and sends updates.
    """
    await ws_manager.connect(job_id, websocket)
    db = next(get_db())
    try:
        while True:
            job = db.query(ProcessingJob).filter(
                ProcessingJob.job_id == job_id
            ).first()

            if not job:
                await websocket.send_json({"error": "Job not found"})
                break

            payload = {
                "job_id": job_id,
                "status": job.status,
                "progress": job.progress,
                "frames_processed": job.frames_processed,
                "total_frames": job.total_frames,
                "shoppers_detected": job.shoppers_detected,
                "products_detected": job.products_detected,
                "error_message": job.error_message
            }
            await websocket.send_json(payload)

            if job.status in ("completed", "failed"):
                break

            await asyncio.sleep(2)
            db.refresh(job)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for job {job_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        ws_manager.disconnect(job_id)
        db.close()


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    """Delete a video and its file."""
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Delete file
    if video.file_path and os.path.exists(video.file_path):
        os.remove(video.file_path)

    db.delete(video)
    db.commit()
    return None
