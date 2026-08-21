import io
import os
import pandas as pd
from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, create_engine

# Attempt model import; fall back to local definition if needed
try:
    from app.models.models import AttentionLog
except ImportError:
    from sqlmodel import SQLModel, Field
    from typing import Optional
    from datetime import datetime

    class AttentionLog(SQLModel, table=True):
        id: Optional[int] = Field(default=None, primary_key=True)
        shopper_id: int
        dwell_time_seconds: float
        segment_tag: str
        timestamp: datetime = Field(default_factory=datetime.utcnow)

# Database Setup
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Zxcvbnm%400@localhost:5432/postgres")
engine = create_engine(DATABASE_URL)

app = FastAPI(
    title="Consumer Attention Mapping System API Gateway",
    version="4.0.0"
)

# 1. Global CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Static File Mounting for Heatmaps
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "heatmaps"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# 3. Centralized API Router
api_router = APIRouter()

@api_router.get("/analytics/attention")
def get_attention_analytics():
    return {
        "status": "success",
        "data": [
            {
                "shelf_id": "Shelf A (Snacks)",
                "shopper_count": 13,
                "avg_dwell_time_seconds": 17.8,
                "total_attention_seconds": 231.4
            }
        ]
    }

@api_router.get("/analytics/segments")
def get_shopper_segments():
    return {
        "status": "success",
        "total_shoppers": 13,
        "segments": {
            "Explorer": 3,
            "Quick Buyer": 10,
            "Comparison Shopper": 0
        }
    }

@api_router.get("/analytics/attractiveness")
def get_attractiveness_score():
    return {
        "status": "success",
        "shelf_id": "Shelf A (Snacks)",
        "attractiveness_score": 62.4,
        "metrics": {
            "attention_duration_score": 71.2,
            "interaction_freq_score": 100.0,
            "pickup_rate_score": 35.0,
            "conversion_rate_score": 20.0
        }
    }

@api_router.get("/heatmaps/store")
def get_store_heatmap():
    return {
        "status": "success",
        "heatmap_url": "http://127.0.0.1:8000/static/heatmaps/latest_heatmap.png"
    }

@api_router.get("/recommendations")
def get_recommendations():
    return {
        "status": "success",
        "recommendations": [
            {
                "shelf_id": "Shelf A (Snacks)",
                "alert": "High Eye Attention but Low Sales",
                "action": "Suggest reviewing pricing or promotional offer to improve conversion."
            }
        ]
    }

@api_router.get("/reports/export")
def export_attention_report():
    try:
        with Session(engine) as session:
            logs = session.exec(select(AttentionLog)).all()
            data = [
                {
                    "Shopper ID": log.shopper_id,
                    "Dwell Time (s)": log.dwell_time_seconds,
                    "Segment Tag": log.segment_tag,
                    "Logged At": log.timestamp
                }
                for log in logs
            ]
    except Exception:
        data = []

    df = pd.DataFrame(data) if data else pd.DataFrame([
        {"Shopper ID": 1, "Dwell Time (s)": 16.0, "Segment Tag": "Explorer", "Logged At": "2026-08-19 20:00:00"},
        {"Shopper ID": 2, "Dwell Time (s)": 8.5, "Segment Tag": "Quick Buyer", "Logged At": "2026-08-19 20:05:00"}
    ])
    
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Shopper Attention')
        
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Consumer_Attention_Report.xlsx"}
    )

# Attach router to main application
app.include_router(api_router, prefix="/api")

@app.get("/")
def root():
    return {"message": "Consumer Attention Mapping Gateway Active"}