"""Reports Router — Generate and download analytics reports (PDF/Excel/CSV)."""

import os
import threading
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Report, Store, User
from ..schemas import ReportGenerateRequest, ReportResponse
from ..auth import get_current_user, RoleChecker
from ..services.report_generator import get_report_generator

router = APIRouter(prefix="/api/reports", tags=["Reports"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])
ALLOWED_TYPES = {
    "consumer_attention", "product_engagement", "shelf_performance",
    "consumer_behavior", "conversion", "marketing"
}
ALLOWED_FORMATS = {"pdf", "excel", "csv"}


def _generate_in_background(report_id: str, db_url: str, request: ReportGenerateRequest):
    """Generate report in a separate thread."""
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        report = db.query(Report).filter(Report.report_id == report_id).first()
        if not report:
            return
        generator = get_report_generator()
        file_path = generator.generate(
            db=db,
            report_type=request.report_type,
            report_format=request.report_format,
            store_id=str(request.store_id) if request.store_id else None,
            parameters=request.parameters
        )
        report.file_path = file_path
        report.status = "completed"
        db.commit()
    except Exception as e:
        report = db.query(Report).filter(Report.report_id == report_id).first()
        if report:
            report.status = "failed"
            db.commit()
    finally:
        db.close()


@router.post("/generate", response_model=ReportResponse, status_code=status.HTTP_202_ACCEPTED)
def generate_report(
    request: ReportGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Kick off report generation as a background task."""
    if request.report_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unknown report type. Allowed: {ALLOWED_TYPES}")
    if request.report_format not in ALLOWED_FORMATS:
        raise HTTPException(status_code=400, detail=f"Unknown format. Allowed: {ALLOWED_FORMATS}")

    if request.store_id:
        store = db.query(Store).filter(Store.store_id == str(request.store_id)).first()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")

    report = Report(
        store_id=str(request.store_id) if request.store_id else None,
        generated_by=str(current_user.id),
        report_type=request.report_type,
        report_format=request.report_format,
        status="generating",
        parameters=request.parameters
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    report_id = str(report.report_id)

    # Generate in background thread
    from ..database import DATABASE_URL
    t = threading.Thread(
        target=_generate_in_background,
        args=(report_id, DATABASE_URL, request),
        daemon=True
    )
    t.start()

    return report


@router.get("", response_model=list[ReportResponse])
def list_reports(
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    query = db.query(Report)
    if store_id:
        query = query.filter(Report.store_id == store_id)
    return query.order_by(Report.created_at.desc()).all()


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.get("/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Download a completed report file."""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "completed":
        raise HTTPException(status_code=425, detail=f"Report not ready. Status: {report.status}")
    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found on server")

    media_types = {
        "pdf": "application/pdf",
        "excel": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "csv": "text/csv"
    }
    media_type = media_types.get(report.report_format, "application/octet-stream")
    filename = os.path.basename(report.file_path)

    return FileResponse(
        path=report.file_path,
        media_type=media_type,
        filename=filename
    )
