from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....core.rbac import get_visible_user_ids
from ....models.quotation import Quotation
from ....models.alert import Alert
from ....models.payment import PaymentSchedule


router = APIRouter()


@router.get("/pipeline")
async def pipeline_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    visible = get_visible_user_ids(db, current_user)
    total = db.query(Quotation).filter(Quotation.id_usuario.in_(visible)).count()
    frio = db.query(Quotation).filter(Quotation.id_usuario.in_(visible), Quotation.estado == "frio").count()
    tibio = db.query(Quotation).filter(Quotation.id_usuario.in_(visible), Quotation.estado == "tibio").count()
    caliente = db.query(Quotation).filter(Quotation.id_usuario.in_(visible), Quotation.estado == "caliente").count()
    return {"total": total, "frio": frio, "tibio": tibio, "caliente": caliente}


@router.get("/alerts")
async def alerts_report(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    total = db.query(Alert).count()
    pendientes = db.query(Alert).filter(Alert.estado_alerta == "pendiente").count()
    atendidas = db.query(Alert).filter(Alert.estado_alerta == "atendido").count()
    return {"total": total, "pendientes": pendientes, "atendidas": atendidas}


@router.get("/billing")
async def billing_report(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # cuotas vencen o se pagan dentro del rango
    due = db.query(PaymentSchedule).filter(PaymentSchedule.due_date >= start, PaymentSchedule.due_date <= end).count()
    paid = db.query(PaymentSchedule).filter(PaymentSchedule.status == "pagado").count()
    return {"cuotas_programadas": due, "cuotas_pagadas": paid}


