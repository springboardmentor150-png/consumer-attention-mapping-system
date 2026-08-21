"""Alerts Router — System and analytics alerts management."""

from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Alert, Store, Camera, User
from ..schemas import AlertCreate, AlertResponse
from ..auth import get_current_user, RoleChecker

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])
any_role = RoleChecker(["Admin", "Store Manager", "Retail Analyst", "Marketing Manager"])
manager_or_admin = RoleChecker(["Admin", "Store Manager"])


@router.get("", response_model=list[AlertResponse])
def list_alerts(
    store_id: Optional[str] = None,
    severity: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    query = db.query(Alert)
    if store_id:
        query = query.filter(Alert.store_id == store_id)
    if severity:
        query = query.filter(Alert.severity == severity)
    if status_filter:
        query = query.filter(Alert.status == status_filter)
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert(
    alert_in: AlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    store = db.query(Store).filter(Store.store_id == str(alert_in.store_id)).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    alert = Alert(
        store_id=str(alert_in.store_id),
        camera_id=str(alert_in.camera_id) if alert_in.camera_id else None,
        alert_type=alert_in.alert_type,
        message=alert_in.message,
        severity=alert_in.severity,
        status="active"
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.status = "resolved"
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(manager_or_admin)
):
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
    return None


@router.get("/counts")
def alert_counts(
    store_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(any_role)
):
    """Get alert counts by severity."""
    query = db.query(Alert).filter(Alert.status == "active")
    if store_id:
        query = query.filter(Alert.store_id == store_id)
    alerts = query.all()
    counts = {"info": 0, "warning": 0, "critical": 0, "total": len(alerts)}
    for a in alerts:
        counts[a.severity] = counts.get(a.severity, 0) + 1
    return counts
