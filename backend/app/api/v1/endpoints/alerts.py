from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.alert import AlertCreate, Alert as AlertSchema
from ....services.alert_service import AlertService

router = APIRouter()


@router.post("/", response_model=AlertSchema)
async def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Crear nueva alerta"""
    try:
        return AlertService.create_alert(db, alert)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[AlertSchema])
async def get_alerts(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return AlertService.get_alerts_with_filters(db=db, skip=skip, limit=limit)


@router.get("/pending", response_model=List[AlertSchema])
async def get_pending_alerts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return AlertService.get_pending_alerts(db)


@router.get("/count", response_model=dict)
async def get_alerts_count(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    total = AlertService.get_total_alerts(db)
    pending = AlertService.get_pending_alerts_count(db)
    return {"total": total, "pending": pending, "high_priority": 0}


@router.patch("/{alert_id}/read")
async def mark_alert_as_read(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    success = AlertService.mark_as_read(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read"}


@router.patch("/{alert_id}/unread")
async def mark_alert_as_unread(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    success = AlertService.mark_as_unread(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as unread"}


@router.patch("/read-all")
async def mark_all_alerts_as_read(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    count = AlertService.mark_all_as_read(db)
    return {"message": f"{count} alerts marked as read"}


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    success = AlertService.delete_alert(db, alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted successfully"}


@router.get("/{alert_id}", response_model=AlertSchema)
async def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    alert = AlertService.get_alert_by_id(db, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert


@router.get("/user/alerts", response_model=List[AlertSchema])
async def get_user_alerts():
    return []


@router.post("/lead-alert", response_model=AlertSchema)
async def create_lead_alert():
    raise HTTPException(status_code=400, detail="not implemented in minimal schema")


@router.get("/statistics/leads")
async def get_lead_statistics():
    return {"detail": "not implemented in minimal schema"}


@router.patch("/{alert_id}/read-lead")
async def mark_lead_alert_as_read():
    raise HTTPException(status_code=400, detail="not implemented in minimal schema")


@router.get("/types/lead-temperatures")
async def get_lead_temperature_info():
    return {"detail": "not implemented in minimal schema"}
