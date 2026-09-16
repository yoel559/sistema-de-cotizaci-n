from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import logging

from ....core.database import get_db
from ....core.security import get_current_active_user
from ....schemas.client import ClientCreate, ClientUpdate, Client as ClientSchema
from ....services.client_service import ClientService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/", response_model=ClientSchema)
async def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Crear nuevo cliente con clasificación de lead"""
    try:
        return ClientService.create_client(db, client)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[ClientSchema])
async def read_clients(
    skip: int = 0,
    limit: int = 1000,
    q: Optional[str] = Query(None, description="Buscar por nombre/teléfono/preferencias"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    try:
        user_email = getattr(current_user, 'correo', 'Unknown') if current_user else 'None'
        logger.info(f"Listando clientes - skip: {skip}, limit: {limit}, user: {user_email}")
        
        if q:
            clients = ClientService.search_clients(db, q)
        else:
            clients = ClientService.get_clients(db, skip=skip, limit=limit)
        
        logger.info(f"Clientes obtenidos: {len(clients)}")
        return clients
    except Exception as e:
        logger.error(f"Error en read_clients: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error al obtener clientes: {str(e)}")


@router.get("/search", response_model=List[ClientSchema])
async def search_clients(
    q: str = Query(..., description="Término de búsqueda"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return ClientService.search_clients(db, q)


@router.get("/statistics")
async def get_client_statistics(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return {"detail": "not implemented in minimal schema"}


@router.get("/with-quotations", response_model=List[ClientSchema])
async def get_clients_with_quotations(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    """Obtener clientes con sus cotizaciones"""
    return ClientService.get_clients(db)


@router.get("/discarded", response_model=List[ClientSchema])
async def get_discarded_clients(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    return ClientService.get_discarded_clients(db)


@router.get("/{client_id}", response_model=ClientSchema)
async def read_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    client = ClientService.get_client_by_id(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return client


@router.put("/{client_id}", response_model=ClientSchema)
async def update_client(
    client_id: int,
    client_update: ClientUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    client = ClientService.update_client(db, client_id, client_update)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}/lead-temperature", response_model=ClientSchema)
async def update_lead_temperature():
    raise HTTPException(status_code=400, detail="not implemented in minimal schema")


@router.put("/{client_id}/discard", response_model=ClientSchema)
async def discard_client(
    client_id: int,
    motivo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    ok = ClientService.discard_client(db, client_id, motivo)
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client discarded"}


@router.put("/{client_id}/restore", response_model=ClientSchema)
async def restore_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    ok = ClientService.restore_client(db, client_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Client not found or not discarded")
    return {"message": "Client restored"}


@router.delete("/{client_id}")
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    success = ClientService.delete_client(db, client_id)
    if not success:
        raise HTTPException(status_code=404, detail="Client not found")
    return {"message": "Client deleted"}
