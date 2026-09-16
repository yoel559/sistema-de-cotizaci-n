from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import date, timedelta

from ..models.payment import PaymentSchedule, Payment
from ..models.quotation import Quotation
from ..schemas.payment import PaymentScheduleCreate, PaymentCreate, PaymentScheduleWithTypeCreate
from ..websockets.manager import safe_broadcast
from datetime import datetime


class PaymentService:
    @staticmethod
    def create_schedule(db: Session, payload: PaymentScheduleCreate) -> PaymentSchedule:
        sched = PaymentSchedule(
            id_cotizacion=payload.id_cotizacion,
            installment_number=payload.installment_number,
            due_date=payload.due_date,
            amount_due=payload.amount_due,
            status="pendiente"
        )
        db.add(sched)
        db.commit()
        db.refresh(sched)
        return sched
    
    @staticmethod
    def create_schedule_with_type(db: Session, payload: PaymentScheduleWithTypeCreate) -> List[PaymentSchedule]:
        """
        Crear cronograma de pago según tipo:
        - contado: 1 cuota del 100%
        - financiado: 2 cuotas (50% inicial, 50% pendiente)
        """
        # Manejar fecha de inicio
        if payload.fecha_inicio is not None:
            fecha_inicio = payload.fecha_inicio
        else:
            fecha_inicio = date.today()
        
        schedules = []
        tipo_pago = payload.tipo_pago.lower().strip()
        
        if tipo_pago == "contado":
            # Pago al contado: 1 cuota del 100%
            schedule = PaymentSchedule(
                id_cotizacion=payload.id_cotizacion,
                installment_number=1,
                due_date=fecha_inicio,
                amount_due=payload.monto_total,
                status="pendiente"
            )
            db.add(schedule)
            schedules.append(schedule)
            
        elif tipo_pago == "financiado":
            # Pago financiado: 2 cuotas (50% inicial, 50% pendiente)
            monto_inicial = payload.monto_total * 0.5
            monto_pendiente = payload.monto_total * 0.5
            dias_vencimiento = payload.dias_vencimiento_financiado if payload.dias_vencimiento_financiado is not None else 30
            
            # Cuota inicial (50%)
            schedule1 = PaymentSchedule(
                id_cotizacion=payload.id_cotizacion,
                installment_number=1,
                due_date=fecha_inicio,
                amount_due=monto_inicial,
                status="pendiente"
            )
            db.add(schedule1)
            schedules.append(schedule1)
            
            # Cuota pendiente (50%)
            schedule2 = PaymentSchedule(
                id_cotizacion=payload.id_cotizacion,
                installment_number=2,
                due_date=fecha_inicio + timedelta(days=dias_vencimiento),
                amount_due=monto_pendiente,
                status="pendiente"
            )
            db.add(schedule2)
            schedules.append(schedule2)
        else:
            raise ValueError(f"Tipo de pago no válido: {payload.tipo_pago}. Debe ser 'contado' o 'financiado'")
        
        db.commit()
        
        # Refrescar para obtener los IDs
        for schedule in schedules:
            db.refresh(schedule)
        
        # Notificar creación de cronograma
        safe_broadcast({
            "type": "payment_schedule_created",
            "data": {
                "id_cotizacion": payload.id_cotizacion,
                "tipo_pago": payload.tipo_pago,
                "monto_total": payload.monto_total,
                "num_cuotas": len(schedules),
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="alerts")
        
        return schedules

    @staticmethod
    def get_schedules(db: Session, skip: int = 0, limit: int = 100) -> List[PaymentSchedule]:
        """Obtener lista de cronogramas de pago con paginación"""
        return db.query(PaymentSchedule).options(
            joinedload(PaymentSchedule.cotizacion).joinedload(Quotation.cliente)
        ).order_by(PaymentSchedule.id.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def list_schedule(db: Session, quotation_id: int) -> List[PaymentSchedule]:
        return db.query(PaymentSchedule).options(
            joinedload(PaymentSchedule.cotizacion).joinedload(Quotation.cliente)
        ).filter(PaymentSchedule.id_cotizacion == quotation_id).order_by(PaymentSchedule.installment_number.asc()).all()

    @staticmethod
    def register_payment(db: Session, payload: PaymentCreate) -> Payment:
        sched = db.query(PaymentSchedule).filter(PaymentSchedule.id == payload.schedule_id).first()
        if not sched:
            raise ValueError("Schedule not found")
        pay = Payment(
            schedule_id=payload.schedule_id,
            paid_amount=payload.paid_amount,
            paid_date=payload.paid_date,
            method=payload.method,
            receipt_number=payload.receipt_number
        )
        db.add(pay)
        # actualizar estado schedule
        try:
            if payload.paid_amount >= sched.amount_due:
                sched.status = "pagado"
            elif payload.paid_date > sched.due_date:
                sched.status = "vencido"
            else:
                sched.status = "pendiente"
        except Exception:
            pass
        db.commit()
        db.refresh(pay)
        
        # Notificar pago registrado
        safe_broadcast({
            "type": "payment_registered",
            "data": {
                "id_pago": pay.id,
                "schedule_id": pay.schedule_id,
                "paid_amount": pay.paid_amount,
                "id_cotizacion": sched.id_cotizacion,
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="alerts")
        
        return pay


