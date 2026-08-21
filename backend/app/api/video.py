from fastapi import APIRouter
from threading import Thread

from app.services.video_service import VideoProcessor

router = APIRouter(prefix="/api/video", tags=["Video"])

# Delay heavy/video-related initialization until an endpoint is called.
processor = None


@router.get("/start")
def start_camera():
    global processor
    if processor is None:
        try:
            processor = VideoProcessor()
        except Exception:
            return {"error": "VideoProcessor initialization failed. Check mediapipe / camera dependencies."}

    Thread(target=processor.process, daemon=True).start()
    return {"message": "Tracking Started"}
