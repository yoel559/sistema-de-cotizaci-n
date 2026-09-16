from sqlalchemy.orm import Session, joinedload
from typing import Optional, List, Dict, Any
from datetime import date, timedelta, datetime
import random

from ..models.quotation import Quotation, QuotationStatusHistory, QuotationStageHistory
from ..schemas.quotation import QuotationCreate, QuotationUpdate
from .quotation_number_service import QuotationNumberService
from ..websockets.manager import websocket_manager
from ..core.rbac import get_visible_user_ids
from ..models.user import User
from ..models.document import Document, DocumentType
from ..models.inventory import VehicleAssignment, Delivery
from ..models.credit import CreditApplication


class QuotationService:

    @staticmethod
    def create_quotation(db: Session, quotation: QuotationCreate) -> Quotation:
        numero = QuotationNumberService.generate_quotation_number(db)
        # Calcular fecha de seguimiento automática según estado según requisitos:
        # Frío: 15 a 45 días (rango aleatorio dentro del rango)
        # Tibio: 7 a 14 días (rango aleatorio dentro del rango)
        # Caliente: 2 a 6 días (rango aleatorio dentro del rango)
        follow_map = {
            "frio": random.randint(15, 45),    # 15 a 45 días
            "tibio": random.randint(7, 14),    # 7 a 14 días
            "caliente": random.randint(2, 6),  # 2 a 6 días
        }
        dias = follow_map.get(quotation.estado.lower(), 10)
        fecha_seguimiento = quotation.fecha_seguimiento or (quotation.fecha_registro + timedelta(days=dias))

        db_q = Quotation(
            numero_cotizacion=numero,
            id_cliente=quotation.id_cliente,
            id_usuario=quotation.id_usuario,
            vehiculo=quotation.vehiculo,
            estado=quotation.estado,
            fecha_registro=quotation.fecha_registro,
            fecha_seguimiento=fecha_seguimiento,
            tipo_pago=quotation.tipo_pago or "contado",
        )
        db.add(db_q)
        db.commit()
        db.refresh(db_q)
        # Broadcast WS para nuevas cotizaciones
        from ..websockets.manager import safe_broadcast
        safe_broadcast({
            "type": "quotation_created",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "estado": db_q.estado,
                "fecha_registro": str(db_q.fecha_registro),
                "vehiculo": db_q.vehiculo,
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="quotations")
        
        # También enviar notificación personal al usuario creador
        from ..websockets.manager import safe_send_personal_message
        safe_send_personal_message({
            "type": "quotation_notification",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "estado": db_q.estado,
                "vehiculo": db_q.vehiculo,
                "message": f"Nueva cotización creada: {db_q.numero_cotizacion}"
            },
            "timestamp": str(datetime.utcnow())
        }, user_id=db_q.id_usuario)
        
        return db_q

    @staticmethod
    def get_quotations(db: Session, skip: int = 0, limit: int = 100, current_user: User | None = None) -> List[Quotation]:
        query = db.query(Quotation).options(
            joinedload(Quotation.cliente),
            joinedload(Quotation.usuario)
        )
        if current_user is not None:
            visible_user_ids = get_visible_user_ids(db, current_user)
            query = query.filter(Quotation.id_usuario.in_(visible_user_ids))
        return query.order_by(Quotation.id_cotizacion.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_quotation_by_id(db: Session, quotation_id: int, current_user: User | None = None) -> Optional[Quotation]:
        q = db.query(Quotation).options(
            joinedload(Quotation.cliente),
            joinedload(Quotation.usuario)
        ).filter(Quotation.id_cotizacion == quotation_id).first()
        if q is None:
            return None
        if current_user is not None:
            visible_user_ids = get_visible_user_ids(db, current_user)
            if q.id_usuario not in visible_user_ids:
                return None
        return q

    @staticmethod
    def get_status_history(db: Session, quotation_id: int) -> list[QuotationStatusHistory]:
        return db.query(QuotationStatusHistory).filter(QuotationStatusHistory.id_cotizacion == quotation_id).order_by(QuotationStatusHistory.id.asc()).all()

    @staticmethod
    def get_stage_history(db: Session, quotation_id: int) -> list[QuotationStageHistory]:
        return db.query(QuotationStageHistory).filter(QuotationStageHistory.id_cotizacion == quotation_id).order_by(QuotationStageHistory.id.asc()).all()

    @staticmethod
    def get_quotation_by_number(db: Session, quotation_number: str, current_user: User | None = None) -> Optional[Quotation]:
        q = db.query(Quotation).filter(Quotation.numero_cotizacion == quotation_number).first()
        if q is None:
            return None
        if current_user is not None:
            visible_user_ids = get_visible_user_ids(db, current_user)
            if q.id_usuario not in visible_user_ids:
                return None
        return q

    @staticmethod
    def get_quotations_by_client(db: Session, client_id: int, current_user: User | None = None) -> List[Quotation]:
        query = db.query(Quotation).options(
            joinedload(Quotation.cliente),
            joinedload(Quotation.usuario)
        ).filter(Quotation.id_cliente == client_id)
        if current_user is not None:
            visible_user_ids = get_visible_user_ids(db, current_user)
            query = query.filter(Quotation.id_usuario.in_(visible_user_ids))
        return query.order_by(Quotation.id_cotizacion.desc()).all()

    @staticmethod
    def update_quotation(db: Session, quotation_id: int, quotation_update: QuotationUpdate) -> Optional[Quotation]:
        db_q = QuotationService.get_quotation_by_id(db, quotation_id)
        if not db_q:
            return None
        # Compatibilidad con Pydantic v1 y v2
        try:
            update_data = quotation_update.model_dump(exclude_unset=True)
        except AttributeError:
            # Fallback para Pydantic v1
            update_data = quotation_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_q, field, value)
        db.commit()
        db.refresh(db_q)
        
        # Notificar actualización de cotización
        from ..websockets.manager import safe_broadcast, safe_send_personal_message
        safe_broadcast({
            "type": "quotation_update",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "estado": db_q.estado,
                "stage": db_q.stage,
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="quotations")
        
        safe_send_personal_message({
            "type": "quotation_notification",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "message": f"Cotización {db_q.numero_cotizacion} actualizada",
            },
            "timestamp": str(datetime.utcnow())
        }, user_id=db_q.id_usuario)
        
        return db_q

    @staticmethod
    def delete_quotation(db: Session, quotation_id: int) -> bool:
        db_q = QuotationService.get_quotation_by_id(db, quotation_id)
        if not db_q:
            return False
        db.delete(db_q)
        db.commit()
        return True

    @staticmethod
    def search_quotations_by_code(db: Session, code: str) -> List[Quotation]:
        return db.query(Quotation).filter(Quotation.numero_cotizacion.ilike(f"%{code}%")).all()

    @staticmethod
    def update_status(db: Session, quotation_id: int, status: str, current_user: User | None = None) -> Optional[Quotation]:
        db_q = QuotationService.get_quotation_by_id(db, quotation_id, current_user)
        if not db_q:
            return None
        # Mapear estados simples: frio/tibio/caliente
        if status not in ("frio", "tibio", "caliente"):
            return None
        old = db_q.estado
        db_q.estado = status
        db.commit()
        db.refresh(db_q)
        try:
            db.add(QuotationStatusHistory(
                id_cotizacion=db_q.id_cotizacion,
                old_status=old,
                new_status=status,
                changed_by=(current_user.id_usuario if current_user else None),
                note=None,
            ))
            db.commit()
        except Exception:
            db.rollback()
        
        # Notificar cambio de estado
        from ..websockets.manager import safe_broadcast, safe_send_personal_message
        safe_broadcast({
            "type": "quotation_update",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "estado": db_q.estado,
                "old_status": old,
                "changed_by": current_user.id_usuario if current_user else None,
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="quotations")
        
        safe_send_personal_message({
            "type": "quotation_notification",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "message": f"Estado de cotización {db_q.numero_cotizacion} cambiado de {old} a {status}",
            },
            "timestamp": str(datetime.utcnow())
        }, user_id=db_q.id_usuario)
        
        return db_q

    @staticmethod
    def advance_stage(
        db: Session,
        quotation_id: int,
        new_stage: str,
        current_user: User | None = None,
        note: str | None = None,
    ) -> Optional[Quotation]:
        allowed_order = [
            "prospecto",
            "orden_compra",
            "contrato",
            "asignacion",
            "entrega",
            "posventa",
        ]
        db_q = QuotationService.get_quotation_by_id(db, quotation_id, current_user)
        if not db_q:
            return None
        if new_stage not in allowed_order:
            return None
        # Validar transición hacia adelante (o igual)
        def stage_index(s: str) -> int:
            try:
                return allowed_order.index(s)
            except ValueError:
                return -1
        if stage_index(new_stage) < stage_index(db_q.stage):
            return None

        # Reglas de prerequisitos por etapa
        # - contrato: documentos requeridos para 'contrato' revisados; si hay crédito, al menos una solicitud aprobada
        # - asignacion: existir asignación de vehículo para la cotización
        # - entrega: existir registro de entrega
        if new_stage == "contrato":
            # documentos con required_in_stage == 'contrato' deben estar en status 'revisado'
            required_types = [dt.id for dt in db.query(DocumentType).filter(DocumentType.required_in_stage == "contrato", DocumentType.active == True).all()]
            if required_types:
                count_required = db.query(Document).filter(Document.id_cotizacion == db_q.id_cotizacion, Document.document_type_id.in_(required_types), Document.status == "revisado").count()
                if count_required < len(required_types):
                    return None
            # si existe solicitud de crédito asociada, verificar una aprobada
            credit_exists = db.query(CreditApplication).filter(CreditApplication.id_cotizacion == db_q.id_cotizacion).count() > 0
            if credit_exists:
                approved = db.query(CreditApplication).filter(CreditApplication.id_cotizacion == db_q.id_cotizacion, CreditApplication.status == "aprobado").count() > 0
                if not approved:
                    return None

        if new_stage == "asignacion":
            assigned = db.query(VehicleAssignment).filter(VehicleAssignment.id_cotizacion == db_q.id_cotizacion, VehicleAssignment.released_at.is_(None)).count() > 0
            if not assigned:
                return None

        if new_stage == "entrega":
            delivered = db.query(Delivery).filter(Delivery.id_cotizacion == db_q.id_cotizacion).count() > 0
            if not delivered:
                return None
        old_stage = db_q.stage
        db_q.stage = new_stage
        db.commit()
        db.refresh(db_q)
        try:
            db.add(QuotationStageHistory(
                id_cotizacion=db_q.id_cotizacion,
                old_stage=old_stage,
                new_stage=new_stage,
                changed_by=(current_user.id_usuario if current_user else None),
                note=note,
            ))
            db.commit()
        except Exception:
            db.rollback()
        
        # Notificar avance de etapa
        from ..websockets.manager import safe_broadcast, safe_send_personal_message
        safe_broadcast({
            "type": "quotation_update",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "stage": db_q.stage,
                "old_stage": old_stage,
                "changed_by": current_user.id_usuario if current_user else None,
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="quotations")
        
        safe_send_personal_message({
            "type": "quotation_notification",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "message": f"Etapa de cotización {db_q.numero_cotizacion} avanzada de {old_stage} a {new_stage}",
            },
            "timestamp": str(datetime.utcnow())
        }, user_id=db_q.id_usuario)
        
        return db_q

    @staticmethod
    def discard(db: Session, quotation_id: int, reason: str | None) -> bool:
        db_q = QuotationService.get_quotation_by_id(db, quotation_id)
        if not db_q:
            return False
        # Descartar = mantener registro pero marcar estado frio (o registrar en comentarios si existiera)
        old_status = db_q.estado
        db_q.estado = "frio"
        db.commit()
        db.refresh(db_q)
        
        # Notificar descarte de cotización
        from ..websockets.manager import safe_broadcast, safe_send_personal_message
        safe_broadcast({
            "type": "quotation_update",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "estado": db_q.estado,
                "old_status": old_status,
                "message": f"Cotización {db_q.numero_cotizacion} descartada",
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="quotations")
        
        safe_send_personal_message({
            "type": "quotation_notification",
            "data": {
                "id_cotizacion": db_q.id_cotizacion,
                "numero_cotizacion": db_q.numero_cotizacion,
                "message": f"Cotización {db_q.numero_cotizacion} descartada" + (f" - Razón: {reason}" if reason else ""),
            },
            "timestamp": str(datetime.utcnow())
        }, user_id=db_q.id_usuario)
        
        return True

    @staticmethod
    def reports_summary(db: Session) -> Dict[str, Any]:
        total = db.query(Quotation).count()
        frio = db.query(Quotation).filter(Quotation.estado == "frio").count()
        tibio = db.query(Quotation).filter(Quotation.estado == "tibio").count()
        caliente = db.query(Quotation).filter(Quotation.estado == "caliente").count()
        return {
            "total_quotations": total,
            "by_status": {"frio": frio, "tibio": tibio, "caliente": caliente}
        }

    @staticmethod
    def reports_detailed(db: Session, start_date: date, end_date: date) -> Dict[str, Any]:
        rows = db.query(Quotation).filter(Quotation.fecha_registro >= start_date, Quotation.fecha_registro <= end_date).all()
        data = [
            {
                "id": q.id_cotizacion,
                "numero": q.numero_cotizacion,
                "estado": q.estado,
                "fecha_registro": q.fecha_registro.isoformat(),
                "fecha_seguimiento": q.fecha_seguimiento.isoformat(),
            }
            for q in rows
        ]
        return {"count": len(data), "items": data}

    @staticmethod
    def get_hot(db: Session) -> List[Quotation]:
        return db.query(Quotation).filter(Quotation.estado == "caliente").order_by(Quotation.id_cotizacion.desc()).all()

    @staticmethod
    def get_dashboard_summary(db: Session) -> Dict[str, Any]:
        total = db.query(Quotation).count()
        # Contar por estado frio/tibio/caliente
        frio = db.query(Quotation).filter(Quotation.estado == "frio").count()
        tibio = db.query(Quotation).filter(Quotation.estado == "tibio").count()
        caliente = db.query(Quotation).filter(Quotation.estado == "caliente").count()

        # Expiran pronto: próximos 3 días con base en fecha_seguimiento
        from datetime import date as _date
        soon = db.query(Quotation).filter(Quotation.fecha_seguimiento <= (_date.today() + timedelta(days=3))).count()

        # Actividad reciente: últimas 5 por fecha_registro/seguimiento
        recent = db.query(Quotation).order_by(Quotation.fecha_seguimiento.desc()).limit(5).all()
        recent_activity = [
            {
                "id": q.id_cotizacion,
                "quotation_number": q.numero_cotizacion,
                "status": q.estado,
                "updated_at": q.fecha_seguimiento.isoformat(),
            }
            for q in recent
        ]

        # Mapear a llaves que espera el frontend
        status_counts = {
            "draft": frio,
            "sent": tibio,
            "accepted": caliente,
            "rejected": 0,
        }

        return {
            "total_quotations": total,
            "total_amount": 0,
            "status_counts": status_counts,
            "hot_quotations": caliente,
            "expiring_soon": soon,
            "conversion_rate": (caliente / total * 100) if total else 0,
            "recent_activity": recent_activity,
        }

    @staticmethod
    def get_quotations_by_client(
        db: Session, 
        client_id: int, 
        current_user: User, 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Quotation]:
        """Obtener todas las cotizaciones de un cliente específico"""
        # Obtener IDs de usuarios visibles según RBAC
        visible_user_ids = get_visible_user_ids(current_user)
        
        # Query base con filtros de RBAC
        query = db.query(Quotation).filter(
            Quotation.cliente_id == client_id,
            Quotation.usuario_id.in_(visible_user_ids)
        )
        
        # Ordenar por fecha de creación descendente
        query = query.order_by(Quotation.fecha_creacion.desc())
        
        # Aplicar paginación
        quotations = query.offset(skip).limit(limit).all()
        
        return quotations

    @staticmethod
    def get_client_quotation_history(
        db: Session, 
        client_id: int, 
        current_user: User
    ) -> Dict[str, Any]:
        """Obtener historial completo de cotizaciones de un cliente"""
        # Obtener IDs de usuarios visibles según RBAC
        visible_user_ids = get_visible_user_ids(current_user)
        
        # Obtener todas las cotizaciones del cliente
        quotations = db.query(Quotation).filter(
            Quotation.cliente_id == client_id,
            Quotation.usuario_id.in_(visible_user_ids)
        ).order_by(Quotation.fecha_creacion.desc()).all()
        
        # Estadísticas del cliente
        total_quotations = len(quotations)
        total_amount = sum(q.valor_total or 0 for q in quotations)
        
        # Contar por estado
        status_counts = {}
        for quotation in quotations:
            status = quotation.estado or 'unknown'
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Contar por etapa
        stage_counts = {}
        for quotation in quotations:
            stage = quotation.stage or 'unknown'
            stage_counts[stage] = stage_counts.get(stage, 0) + 1
        
        # Última actividad
        last_activity = quotations[0].fecha_creacion if quotations else None
        
        # Cotizaciones por año
        yearly_stats = {}
        for quotation in quotations:
            year = quotation.fecha_creacion.year
            if year not in yearly_stats:
                yearly_stats[year] = {
                    'count': 0,
                    'amount': 0,
                    'quotations': []
                }
            yearly_stats[year]['count'] += 1
            yearly_stats[year]['amount'] += quotation.valor_total or 0
            yearly_stats[year]['quotations'].append({
                'id': quotation.id,
                'numero_cotizacion': quotation.numero_cotizacion,
                'fecha_creacion': quotation.fecha_creacion,
                'valor_total': quotation.valor_total,
                'estado': quotation.estado,
                'stage': quotation.stage
            })
        
        return {
            'client_id': client_id,
            'total_quotations': total_quotations,
            'total_amount': total_amount,
            'status_counts': status_counts,
            'stage_counts': stage_counts,
            'last_activity': last_activity,
            'yearly_stats': yearly_stats,
            'quotations': [
                {
                    'id': q.id,
                    'numero_cotizacion': q.numero_cotizacion,
                    'fecha_creacion': q.fecha_creacion,
                    'valor_total': q.valor_total,
                    'estado': q.estado,
                    'stage': q.stage,
                    'vehiculo': q.vehiculo,
                    'usuario': {
                        'id': q.usuario.id if q.usuario else None,
                        'nombre': q.usuario.nombre if q.usuario else None
                    } if q.usuario else None
                }
                for q in quotations
            ]
        }
