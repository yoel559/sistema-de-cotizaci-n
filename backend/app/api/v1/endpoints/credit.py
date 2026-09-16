from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.credit import (
    CreditApplicationCreate,
    CreditApplication,
    CreditApprovalCreate,
    CreditApproval,
    GuaranteeCreate,
    Guarantee,
)
from ....services.credit_service import CreditService


router = APIRouter()


@router.get("/applications", response_model=List[CreditApplication])
async def get_applications(
    skip: int = Query(0, description="Número de registros a omitir"),
    limit: int = Query(100, description="Número máximo de registros a devolver"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener lista de aplicaciones de crédito con paginación"""
    return CreditService.get_applications(db, skip=skip, limit=limit)


@router.post("/applications", response_model=CreditApplication)
async def create_application(
    payload: CreditApplicationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return CreditService.create_application(db, payload)


@router.post("/approvals", response_model=CreditApproval)
async def approve_application(
    payload: CreditApprovalCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    try:
        return CreditService.approve_application(db, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/guarantees", response_model=Guarantee)
async def add_guarantee(
    payload: GuaranteeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return CreditService.add_guarantee(db, payload)


@router.get("/quotation/{quotation_id}", response_model=List[CreditApplication])
async def list_by_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return CreditService.list_by_quotation(db, quotation_id)


