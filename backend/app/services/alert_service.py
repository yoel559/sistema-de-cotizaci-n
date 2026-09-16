from sqlalchemy.orm import Session
from typing import Optional, List

from ..models.alert import Alert
from ..schemas.alert import AlertCreate
from ..websockets.manager import websocket_manager
from ..notifications.tasks import send_email_notification
from ..core.config import settings


class AlertService:
    @staticmethod
    def create_alert(db: Session, alert: AlertCreate) -> Alert:
        db_alert = Alert(
            id_cotizacion=alert.id_cotizacion,
            fecha_alerta=alert.fecha_alerta,
            estado_alerta=alert.estado_alerta or "pendiente",
            message=alert.message,
        )
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        
        # Notificar creación de alerta
        from ..websockets.manager import safe_broadcast
        from datetime import datetime
        safe_broadcast({
            "type": "alert",
            "data": {
                "id_alerta": db_alert.id_alerta,
                "id_cotizacion": db_alert.id_cotizacion,
                "fecha_alerta": str(db_alert.fecha_alerta),
                "estado_alerta": db_alert.estado_alerta,
                "message": db_alert.message or f"Nueva alerta para cotización {db_alert.id_cotizacion}",
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="alerts")
        
        return db_alert

    @staticmethod
    def create_followup_alert(db: Session, id_cotizacion: int, fecha_alerta) -> Alert:
        """Crear alerta simple para seguimiento de cotización."""
        db_alert = Alert(
            id_cotizacion=id_cotizacion,
            fecha_alerta=fecha_alerta,
            estado_alerta="pendiente",
        )
        db.add(db_alert)
        db.commit()
        db.refresh(db_alert)
        # Broadcast WS (genérico)
        from ..websockets.manager import safe_broadcast
        from datetime import datetime
        safe_broadcast({
            "type": "alert",
            "data": {
                "id_alerta": db_alert.id_alerta,
                "id_cotizacion": db_alert.id_cotizacion,
                "fecha_alerta": str(db_alert.fecha_alerta),
                "estado_alerta": db_alert.estado_alerta,
                "message": f"Alerta de seguimiento para cotización {db_alert.id_cotizacion}",
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="alerts")
        # Encolar email si SendGrid está configurado
        try:
            if settings.sendgrid_api_key:
                subject = "Recordatorio de seguimiento de cotización"
                html = f"""
                <html>
                <body>
                    <p>Recordatorio de seguimiento para la cotización <strong>{db_alert.id_cotizacion}</strong>.</p>
                    <p>Fecha de seguimiento: {db_alert.fecha_alerta}</p>
                </body>
                </html>
                """
                send_email_notification.delay("admin@trading-system.com", subject, html)
        except Exception:
            pass
        return db_alert

    @staticmethod
    def get_alerts_with_filters(
        db: Session,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Alert]:
        return db.query(Alert).order_by(Alert.id_alerta.desc()).offset(skip).limit(limit).all()

    @staticmethod
    def get_pending_alerts(db: Session) -> List[Alert]:
        return db.query(Alert).filter(Alert.estado_alerta == "pendiente").order_by(Alert.id_alerta.desc()).all()

    @staticmethod
    def get_pending_alerts_count(db: Session) -> int:
        return db.query(Alert).filter(Alert.estado_alerta == "pendiente").count()

    @staticmethod
    def get_high_priority_alerts_count(db: Session) -> int:
        return 0

    @staticmethod
    def get_total_alerts(db: Session) -> int:
        return db.query(Alert).count()

    @staticmethod
    def mark_as_read(db: Session, alert_id: int) -> bool:
        alert = db.query(Alert).filter(Alert.id_alerta == alert_id).first()
        if not alert:
            return False
        alert.estado_alerta = "atendido"
        db.commit()
        
        # Notificar cambio de estado
        from ..websockets.manager import safe_broadcast
        from datetime import datetime
        safe_broadcast({
            "type": "alert_update",
            "data": {
                "id_alerta": alert.id_alerta,
                "id_cotizacion": alert.id_cotizacion,
                "estado_alerta": alert.estado_alerta,
                "message": f"Alerta {alert_id} marcada como atendida",
            },
            "timestamp": str(datetime.utcnow())
        }, subscription_type="alerts")
        
        return True

    @staticmethod
    def mark_as_unread(db: Session, alert_id: int) -> bool:
        alert = db.query(Alert).filter(Alert.id_alerta == alert_id).first()
        if not alert:
            return False
        alert.estado_alerta = "pendiente"
        db.commit()
        return True

    @staticmethod
    def mark_all_as_read(db: Session) -> int:
        count = db.query(Alert).filter(Alert.estado_alerta == "pendiente").update({"estado_alerta": "atendido"})
        db.commit()
        
        # Notificar cambio masivo
        if count > 0:
            from ..websockets.manager import safe_broadcast
            from datetime import datetime
            safe_broadcast({
                "type": "alert_update",
                "data": {
                    "message": f"{count} alertas marcadas como atendidas",
                    "count": count,
                },
                "timestamp": str(datetime.utcnow())
            }, subscription_type="alerts")
        
        return count

    @staticmethod
    def delete_alert(db: Session, alert_id: int) -> bool:
        alert = db.query(Alert).filter(Alert.id_alerta == alert_id).first()
        if not alert:
            return False
        db.delete(alert)
        db.commit()
        return True

    @staticmethod
    def get_alert_by_id(db: Session, alert_id: int) -> Optional[Alert]:
        return db.query(Alert).filter(Alert.id_alerta == alert_id).first()

    @staticmethod
    def create_quotation_expired_alert(db: Session, id_cotizacion: int) -> Alert:
        raise NotImplementedError

    @staticmethod
    def create_hot_quotation_alert(db: Session) -> Alert:
        raise NotImplementedError

    @staticmethod
    def create_system_alert(db: Session) -> Alert:
        raise NotImplementedError
