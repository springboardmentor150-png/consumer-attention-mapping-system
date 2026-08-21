"""
Consumer Attention Mapping System — FastAPI Backend
"""

import logging
import os
import psutil
from datetime import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import engine, Base, init_db
from .auth import get_current_user
from .models import User
from .routers import auth, stores, shelves, cameras
from .routers import (
    products, zones, videos, tracking,
    attention, analytics, recommendations, reports, alerts
)

# ── Logging ──────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

# ── Initialize DB tables ─────────────────
init_db()

# ── FastAPI app ───────────────────────────
app = FastAPI(
    title="Consumer Attention Mapping System API",
    description="""
## Consumer Attention Mapping System

AI-powered retail analytics platform using computer vision to understand shopper behavior.

### Pipeline
Camera/Video → Frame Extraction → YOLOv11 Person Detection → ByteTrack →
Zone Detection → Dwell Time → Head-pose Attention → Product Detection →
Behavior Analytics → Heatmaps → Product Scores → Recommendations

### Disclaimer
- Attention estimates use **head-pose analysis** (MediaPipe), NOT true eye-tracking
- Purchase conversion data only available with POS integration
- No facial recognition — anonymous shopper IDs only
    """,
    version="1.0.0",
    contact={"name": "CAMS Team"},
    license_info={"name": "Private"}
)


@app.on_event("startup")
def seed_admin_user():
    """Auto-seed default Admin user if no user exists."""
    from .database import SessionLocal
    from .models import User
    from .auth import hash_password
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@store.com").first()
        if not admin:
            admin = User(
                name="System Admin",
                email="admin@store.com",
                password_hash=hash_password("admin123"),
                role="Admin",
                is_active=True
            )
            db.add(admin)
            db.commit()
            logger.info("Auto-seeded default admin user: admin@store.com / admin123")
    except Exception as e:
        logger.warning(f"Could not seed admin user: {e}")
    finally:
        db.close()


# ── CORS ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files (reports, uploads) ──────
REPORTS_DIR = os.getenv("REPORTS_DIR", "backend/uploads/reports")
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs("backend/uploads/videos", exist_ok=True)

# ── Register Routers ──────────────────────
# Phase 1 — Auth
app.include_router(auth.router)

# Phase 2 — Retail Management
app.include_router(stores.router)
app.include_router(zones.router)
app.include_router(shelves.router)
app.include_router(products.router)
app.include_router(cameras.router)

# Phase 3 — Video & Processing
app.include_router(videos.router)

# Phase 4 — Tracking
app.include_router(tracking.router)

# Phase 5 — Attention
app.include_router(attention.router)

# Phase 6 — Analytics
app.include_router(analytics.router)

# Phase 7 — Intelligence
app.include_router(recommendations.router)
app.include_router(alerts.router)

# Phase 8 — Reports
app.include_router(reports.router)


# ── Health & Root ─────────────────────────
@app.get("/", tags=["System"])
def root():
    return {
        "status": "online",
        "system": "Consumer Attention Mapping System",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc"
    }


@app.get("/api/health", tags=["System"])
def health_check():
    """System health endpoint."""
    from .database import SessionLocal
    from .models import Video, ShopperSession, ProcessingJob

    db_status = "connected"
    video_count = 0
    session_count = 0
    active_jobs = 0

    try:
        db = SessionLocal()
        video_count = db.query(Video).count()
        session_count = db.query(ShopperSession).count()
        active_jobs = db.query(ProcessingJob).filter(
            ProcessingJob.status.in_(["queued", "running"])
        ).count()
        db.close()
    except Exception as e:
        db_status = f"error: {str(e)}"

    try:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory().percent
        disk = psutil.disk_usage("/").percent
    except Exception:
        cpu, mem, disk = None, None, None

    # Check if ML models are loaded (non-blocking)
    ml_loaded = False
    try:
        from .ml.detection.yolo_detector import _detector_instance
        ml_loaded = _detector_instance is not None and _detector_instance.is_person_model_loaded
    except Exception:
        pass

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "ml_models_loaded": ml_loaded,
        "active_jobs": active_jobs,
        "total_videos": video_count,
        "total_sessions": session_count,
        "cpu_percent": cpu,
        "memory_percent": mem,
        "disk_percent": disk,
        "timestamp": datetime.utcnow().isoformat()
    }
