from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.payment import (
    PaymentScheduleCreate,
    PaymentSchedule,
    PaymentCreate,
    Payment,
    PaymentScheduleWithTypeCreate,
)
from ....services.payment_service import PaymentService


router = APIRouter()


@router.get("/schedules", response_model=List[PaymentSchedule])
async def get_schedules(
    skip: int = Query(0, description="Número de registros a omitir"),
    limit: int = Query(100, description="Número máximo de registros a devolver"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener lista de cronogramas de pago con paginación"""
    return PaymentService.get_schedules(db, skip=skip, limit=limit)


@router.post("/schedule", response_model=PaymentSchedule)
async def create_schedule(
    payload: PaymentScheduleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Crear cronograma de pago manual (cuota por cuota)"""
    return PaymentService.create_schedule(db, payload)


@router.post("/schedule-with-type", response_model=List[PaymentSchedule])
async def create_schedule_with_type(
    payload: PaymentScheduleWithTypeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """
    Crear cronograma de pago según tipo:
    - contado: Crea 1 cuota del 100%
    - financiado: Crea 2 cuotas (50% inicial, 50% pendiente)
    """
    try:
        return PaymentService.create_schedule_with_type(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/schedule/{quotation_id}", response_model=List[PaymentSchedule])
async def list_schedule(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return PaymentService.list_schedule(db, quotation_id)


@router.post("/payments", response_model=Payment)
async def register_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    try:
        return PaymentService.register_payment(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


