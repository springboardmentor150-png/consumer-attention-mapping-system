import os
import shutil
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.models.video_track import VideoRecord, PersonTrack, TrackingPoint
from app.models.store import Store
from app.services.video_processor import VideoProcessorService

router = APIRouter(prefix="/api/video", tags=["Real YOLO Video Analytics"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
PROCESSED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "processed")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Singleton video processor
_processor: Optional[VideoProcessorService] = None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_processor() -> VideoProcessorService:
    global _processor
    if _processor is None:
        _processor = VideoProcessorService(confidence=0.35)
    return _processor


class VideoListItem(BaseModel):
    id: int
    store_id: int
    store_name: Optional[str] = None
    camera_id: str
    video_name: str
    resolution: str
    fps: float
    duration_seconds: float
    total_frames: int
    unique_tracks_count: int
    status: str
    created_at: str


class PersonTrackItem(BaseModel):
    track_id: int
    first_seen_time: float
    last_seen_time: float
    total_frames: int
    dwell_seconds: float


class HeatmapPoint(BaseModel):
    x: float
    y: float
    weight: float
    track_id: int
    frame: int
    time: float


class TrajectoryPath(BaseModel):
    track_id: int
    dwell_seconds: float
    points: List[List[float]]  # [[x, y], [x, y], ...]


class VideoHeatmapResponse(BaseModel):
    video_id: int
    video_name: str
    width: int
    height: int
    total_points: int
    unique_tracks: int
    points: List[HeatmapPoint]
    trajectories: List[TrajectoryPath]


@router.post("/upload")
async def upload_and_process_video(
    file: UploadFile = File(...),
    store_id: int = Form(1),
    camera_id: str = Form("CAM-01"),
    confidence: float = Form(0.35),
    db: Session = Depends(get_db),
):
    """
    Upload an actual CCTV video for a specific store and camera, execute YOLOv8 + ByteTrack frame-by-frame,
    render real bounding boxes & Track IDs onto the video, store tracking points
    in PostgreSQL, and produce authentic heatmap data.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save original uploaded file
    input_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    processor = get_processor()
    processor.confidence = confidence

    try:
        result = processor.process_video_file(
            db=db,
            input_video_path=input_path,
            output_dir=PROCESSED_DIR,
            store_id=store_id,
            camera_id=camera_id,
            video_name=file.filename,
        )

        return {
            "success": True,
            "message": "Real YOLOv8 video analytics pipeline completed successfully.",
            "data": result,
        }
    except Exception as e:
        print(f"[ERROR] Video processing failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list", response_model=List[VideoListItem])
def list_processed_videos(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve processed CCTV videos with actual detection metrics, optionally filtered by store.
    """
    query = db.query(VideoRecord)
    if store_id is not None:
        query = query.filter(VideoRecord.store_id == store_id)
    videos = query.order_by(VideoRecord.id.desc()).all()

    # Query store names from PostgreSQL
    stores = {s.id: s.name for s in db.query(Store).all()}

    return [
        VideoListItem(
            id=v.id,
            store_id=v.store_id or 1,
            store_name=stores.get(v.store_id, f"Store #{v.store_id or 1}"),
            camera_id=v.camera_id,
            video_name=v.video_name,
            resolution=f"{v.resolution_w}x{v.resolution_h}",
            fps=v.fps,
            duration_seconds=v.duration_seconds,
            total_frames=v.total_frames,
            unique_tracks_count=v.unique_tracks_count,
            status=v.status,
            created_at=v.created_at.strftime("%Y-%m-%d %H:%M:%S") if v.created_at else "",
        )
        for v in videos
    ]


@router.get("/{video_id}")
def get_video_details(video_id: int, db: Session = Depends(get_db)):
    """
    Get video tracking details and person sessions.
    """
    video = db.query(VideoRecord).filter(VideoRecord.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")

    tracks = (
        db.query(PersonTrack)
        .filter(PersonTrack.video_id == video_id)
        .order_by(PersonTrack.dwell_seconds.desc())
        .all()
    )

    return {
        "video": {
            "id": video.id,
            "camera_id": video.camera_id,
            "video_name": video.video_name,
            "resolution": f"{video.resolution_w}x{video.resolution_h}",
            "fps": video.fps,
            "duration_seconds": video.duration_seconds,
            "total_frames": video.total_frames,
            "unique_tracks_count": video.unique_tracks_count,
            "status": video.status,
        },
        "tracks": [
            PersonTrackItem(
                track_id=t.track_id,
                first_seen_time=t.first_seen_time,
                last_seen_time=t.last_seen_time,
                total_frames=t.total_frames,
                dwell_seconds=t.dwell_seconds,
            )
            for t in tracks
        ],
    }


@router.get("/{video_id}/heatmap", response_model=VideoHeatmapResponse)
def get_video_heatmap_data(video_id: int, db: Session = Depends(get_db)):
    """
    Return authentic heatmap points and customer trajectory paths constructed
    strictly from the PostgreSQL tracking_points table generated by YOLOv8.
    Zero fabricated or random points.
    """
    video = db.query(VideoRecord).filter(VideoRecord.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video record not found")

    # Fetch real points recorded by YOLO
    points = (
        db.query(TrackingPoint)
        .filter(TrackingPoint.video_id == video_id)
        .order_by(TrackingPoint.frame_number.asc())
        .all()
    )

    heatmap_points: List[HeatmapPoint] = []
    track_trajectories: dict[int, List[List[float]]] = {}

    for pt in points:
        heatmap_points.append(
            HeatmapPoint(
                x=pt.x,
                y=pt.y,
                weight=min(1.0, max(0.2, pt.confidence)),
                track_id=pt.track_id,
                frame=pt.frame_number,
                time=pt.timestamp_sec,
            )
        )
        if pt.track_id not in track_trajectories:
            track_trajectories[pt.track_id] = []
        # Downsample trajectory points slightly for smooth polyline rendering
        if len(track_trajectories[pt.track_id]) == 0 or pt.frame_number % 2 == 0:
            track_trajectories[pt.track_id].append([round(pt.x, 1), round(pt.y, 1)])

    # Fetch track dwell times
    tracks = db.query(PersonTrack).filter(PersonTrack.video_id == video_id).all()
    dwell_map = {t.track_id: t.dwell_seconds for t in tracks}

    trajectories_list: List[TrajectoryPath] = [
        TrajectoryPath(
            track_id=tid,
            dwell_seconds=dwell_map.get(tid, 0.0),
            points=pts,
        )
        for tid, pts in track_trajectories.items()
    ]

    return VideoHeatmapResponse(
        video_id=video.id,
        video_name=video.video_name,
        width=video.resolution_w,
        height=video.resolution_h,
        total_points=len(heatmap_points),
        unique_tracks=video.unique_tracks_count,
        points=heatmap_points,
        trajectories=trajectories_list,
    )


@router.get("/{video_id}/stream")
def stream_processed_video(video_id: int, db: Session = Depends(get_db)):
    """
    Stream the processed CCTV video containing the actual YOLO bounding boxes and track IDs.
    """
    video = db.query(VideoRecord).filter(VideoRecord.id == video_id).first()
    if not video or not video.processed_path or not os.path.exists(video.processed_path):
        raise HTTPException(status_code=404, detail="Processed video file not found")

    return FileResponse(
        video.processed_path,
        media_type="video/mp4",
        filename=os.path.basename(video.processed_path),
    )
