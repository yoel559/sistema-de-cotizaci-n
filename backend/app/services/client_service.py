from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from ..models.client import Client
from ..models.quotation import Quotation
from ..models.discarded import Discarded
from datetime import date
from ..schemas.client import ClientCreate, ClientUpdate


class ClientService:
    """Servicio de clientes alineado al esquema de producción."""

    @staticmethod
    def create_client(db: Session, client_data: ClientCreate) -> Client:
        db_client = Client(
            nombre=client_data.nombre,
            apellidos=client_data.apellidos,
            telefono=client_data.telefono,
            email=client_data.email,
            preferencias=client_data.preferencias,
        )
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        return db_client

    @staticmethod
    def get_client_by_id(db: Session, client_id: int) -> Optional[Client]:
        return db.query(Client).filter(Client.id_cliente == client_id).first()

    @staticmethod
    def get_clients(db: Session, skip: int = 0, limit: int = 100) -> List[Client]:
        return db.query(Client).order_by(Client.id_cliente.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def update_client(db: Session, client_id: int, client_update: ClientUpdate) -> Optional[Client]:
        db_client = ClientService.get_client_by_id(db, client_id)
        if not db_client:
            return None
        update_data = client_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_client, field, value)
        db.commit()
        db.refresh(db_client)
        return db_client

    @staticmethod
    def delete_client(db: Session, client_id: int) -> bool:
        db_client = ClientService.get_client_by_id(db, client_id)
        if not db_client:
            return False
        db.delete(db_client)
        db.commit()
        return True

    @staticmethod
    def discard_client(db: Session, client_id: int, motivo: str | None) -> bool:
        if not ClientService.get_client_by_id(db, client_id):
            return False
        disc = Discarded(id_cliente=client_id, motivo=motivo, fecha_descartado=date.today())
        db.add(disc)
        db.commit()
        return True

    @staticmethod
    def restore_client(db: Session, client_id: int) -> bool:
        # Restaurar = eliminar última marca de descarte
        disc = db.query(Discarded).filter(Discarded.id_cliente == client_id).order_by(Discarded.id_descartado.desc()).first()
        if not disc:
            return False
        db.delete(disc)
        db.commit()
        return True

    @staticmethod
    def get_discarded_clients(db: Session) -> List[Client]:
        # Devolver clientes que tienen al menos un registro en descartados
        subq = db.query(Discarded.id_cliente).subquery()
        return db.query(Client).filter(Client.id_cliente.in_(subq)).all()

    @staticmethod
    def search_clients(db: Session, q: str) -> List[Client]:
        return db.query(Client).filter(
            (Client.nombre.ilike(f"%{q}%")) |
            (Client.apellidos.ilike(f"%{q}%")) |
            (Client.telefono.ilike(f"%{q}%")) |
            (Client.email.ilike(f"%{q}%")) |
            (Client.preferencias.ilike(f"%{q}%"))
        ).all()

    @staticmethod
    def get_clients_with_quotations(db: Session) -> List[Dict[str, Any]]:
        clients = db.query(Client).all()
        result: List[Dict[str, Any]] = []
        for client in clients:
            quotations = db.query(Quotation).filter(Quotation.id_cliente == client.id_cliente).all()
            result.append({
                "client": {
                    "id_cliente": client.id_cliente,
                    "nombre": client.nombre,
                    "apellidos": client.apellidos,
                    "telefono": client.telefono,
                },
                "quotations": [
                    {
                        "id_cotizacion": q.id_cotizacion,
                        "numero_cotizacion": q.numero_cotizacion,
                        "vehiculo": q.vehiculo,
                        "estado": q.estado,
                        "fecha_registro": str(q.fecha_registro),
                    } for q in quotations
                ],
                "quotations_count": len(quotations)
            })
        return result
