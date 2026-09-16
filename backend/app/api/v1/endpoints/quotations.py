from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, date
import tempfile
import os

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.quotation import (
    QuotationCreate, QuotationUpdate, Quotation as QuotationSchema
)
from ....services.quotation_service import QuotationService
from ....services.alert_service import AlertService
from ....utils.pdf_generator import generate_quotation_pdf
from ....core.rbac import require_roles, get_role_level, ALLOWED_ROLES

router = APIRouter()


@router.post("/", response_model=QuotationSchema)
async def create_quotation(
    quotation: QuotationCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    db_q = QuotationService.create_quotation(db=db, quotation=quotation)
    # Crear alerta de seguimiento automáticamente
    try:
        AlertService.create_followup_alert(db, db_q.id_cotizacion, db_q.fecha_seguimiento)
    except Exception:
        pass
    return db_q


@router.get("/", response_model=List[QuotationSchema])
async def read_quotations(
    skip: int = 0,
    limit: int = 1000,
    search_code: Optional[str] = Query(None, description="Buscar por código de cotización"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    if search_code:
        # Búsqueda no aplica scoping en este minimal; podría filtrarse después si se requiere
        return QuotationService.search_quotations_by_code(db, search_code)
    return QuotationService.get_quotations(db, skip=skip, limit=limit, current_user=current_user)


@router.get("/dashboard", response_model=dict)
async def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return QuotationService.get_dashboard_summary(db)


@router.get("/client/{client_id}/history", response_model=List[QuotationSchema])
async def get_client_history(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return QuotationService.get_quotations_by_client(db, client_id, current_user)


@router.get("/reports/summary", response_model=dict)
async def get_reports_summary(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return QuotationService.reports_summary(db)


@router.get("/reports/detailed", response_model=dict)
async def get_detailed_report(
    start: date = Query(..., description="Fecha inicio YYYY-MM-DD"),
    end: date = Query(..., description="Fecha fin YYYY-MM-DD"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return QuotationService.reports_detailed(db, start, end)


@router.patch("/{quotation_id}/discard")
async def discard_quotation(
    quotation_id: int,
    reason: Optional[str] = Query(None, description="Razón del descarte"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    ok = QuotationService.discard(db, quotation_id, reason)
    if not ok:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return {"message": "Quotation discarded"}


@router.get("/{quotation_id}/pdf")
async def generate_quotation_pdf_endpoint(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    quotation = QuotationService.get_quotation_by_id(db, quotation_id)
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    pdf_path = generate_quotation_pdf(quotation)
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"cotizacion_{quotation.numero_cotizacion}.pdf")


@router.get("/{quotation_id}", response_model=QuotationSchema)
async def read_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    quotation = QuotationService.get_quotation_by_id(db, quotation_id=quotation_id, current_user=current_user)
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation


@router.get("/number/{quotation_number}", response_model=QuotationSchema)
async def read_quotation_by_number(
    quotation_number: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    quotation = QuotationService.get_quotation_by_number(db, quotation_number=quotation_number, current_user=current_user)
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation


@router.put("/{quotation_id}", response_model=QuotationSchema)
async def update_quotation(
    quotation_id: int,
    quotation_update: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    quotation = QuotationService.update_quotation(db, quotation_id=quotation_id, quotation_update=quotation_update)
    if quotation is None:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return quotation


@router.patch("/{quotation_id}/status", response_model=QuotationSchema)
async def update_quotation_status(
    quotation_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    q = QuotationService.update_status(db, quotation_id, status, current_user)
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found or invalid status")
    return q


@router.patch("/{quotation_id}/stage", response_model=QuotationSchema)
async def advance_quotation_stage(
    quotation_id: int,
    new_stage: str,
    note: str | None = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Reglas de rol mínimo por etapa
    stage_min_role = {
        "contrato": "jefe",
        "asignacion": "jefe",
        "entrega": "jefe",
        "posventa": "empleado",
    }
    required = stage_min_role.get(new_stage)
    if required:
        if get_role_level(current_user) < ALLOWED_ROLES[required]:
            raise HTTPException(status_code=403, detail="Rol insuficiente para avanzar a esta etapa")
    q = QuotationService.advance_stage(db, quotation_id, new_stage, current_user, note)
    if not q:
        raise HTTPException(status_code=400, detail="Invalid stage transition or quotation not found")
    return q


@router.get("/{quotation_id}/history/status")
async def get_status_history(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    q = QuotationService.get_quotation_by_id(db, quotation_id, current_user)
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    rows = QuotationService.get_status_history(db, quotation_id)
    return [
        {
            "old_status": r.old_status,
            "new_status": r.new_status,
            "changed_by": r.changed_by,
            "note": r.note,
            "created_at": str(r.created_at),
        }
        for r in rows
    ]


@router.get("/{quotation_id}/history/stage")
async def get_stage_history(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    q = QuotationService.get_quotation_by_id(db, quotation_id, current_user)
    if not q:
        raise HTTPException(status_code=404, detail="Quotation not found")
    rows = QuotationService.get_stage_history(db, quotation_id)
    return [
        {
            "old_stage": r.old_stage,
            "new_stage": r.new_stage,
            "changed_by": r.changed_by,
            "note": r.note,
            "created_at": str(r.created_at),
        }
        for r in rows
    ]


@router.delete("/{quotation_id}")
async def delete_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    success = QuotationService.delete_quotation(db, quotation_id=quotation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return {"message": "Quotation deleted"}


@router.get("/client/{client_id}", response_model=List[QuotationSchema])
async def read_client_quotations():
    return []


@router.get("/hot/quotations", response_model=List[QuotationSchema])
async def read_hot_quotations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return QuotationService.get_hot(db)


@router.get("/search/code", response_model=List[QuotationSchema])
async def search_quotations_by_code(
    code: str = Query(..., description="Código de cotización a buscar"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return QuotationService.search_quotations_by_code(db, code)


@router.post("/search/advanced", response_model=List[QuotationSchema])
async def search_quotations_advanced():
    return []


@router.get("/{quotation_id}/print-data")
async def get_quotation_print_data():
    raise HTTPException(status_code=400, detail="not implemented in minimal schema")


@router.get("/statistics/lead-temperature")
async def get_quotation_statistics_by_lead_temperature():
    return {"detail": "not implemented in minimal schema"}


@router.get("/next-number")
async def get_next_quotation_number(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    from ....services.quotation_number_service import QuotationNumberService
    next_number = QuotationNumberService.get_next_available_number(db)
    return {"next_quotation_number": next_number}


@router.get("/client/{client_id}", response_model=List[QuotationSchema])
async def get_quotations_by_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000)
):
    """Obtener todas las cotizaciones de un cliente específico"""
    try:
        service = QuotationService(db)
        quotations = service.get_quotations_by_client(
            client_id=client_id,
            current_user=current_user,
            skip=skip,
            limit=limit
        )
        return quotations
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener cotizaciones del cliente: {str(e)}"
        )


@router.get("/client/{client_id}/history")
async def get_client_quotation_history(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener historial completo de cotizaciones de un cliente"""
    try:
        service = QuotationService(db)
        history = service.get_client_quotation_history(
            client_id=client_id,
            current_user=current_user
        )
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historial del cliente: {str(e)}"
        )
