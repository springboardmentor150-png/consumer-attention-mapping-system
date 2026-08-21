import io
import pandas as pd
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select, create_engine
from app.models.models import AttentionLog

router = APIRouter()
DATABASE_URL = "postgresql://postgres:Zxcvbnm%400@localhost:5432/postgres"
engine = create_engine(DATABASE_URL)

@router.get("/api/reports/export")
def export_attention_report():
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

    df = pd.DataFrame(data) if data else pd.DataFrame(columns=["Shopper ID", "Dwell Time (s)", "Segment Tag", "Logged At"])
    
    stream = io.BytesIO()
    with pd.ExcelWriter(stream, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Shopper Attention')
        
    stream.seek(0)
    
    return StreamingResponse(
        stream,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Consumer_Attention_Report.xlsx"}
    )