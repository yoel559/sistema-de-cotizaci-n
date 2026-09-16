import logging
from datetime import datetime, timedelta
from typing import Optional
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import text

from ..core.database import SessionLocal
from ..models.quotation import Quotation
from ..models.alert import Alert
from ..services.alert_service import AlertService

logger = logging.getLogger(__name__)

# Scheduler global
_scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> AsyncIOScheduler:
    """Obtener instancia del scheduler"""
    global _scheduler
    
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    
    return _scheduler


def start_scheduler():
    """Iniciar el scheduler"""
    global _scheduler
    
    if _scheduler is None:
        _scheduler = AsyncIOScheduler()
    
    # Agregar tareas programadas
    add_scheduled_jobs()
    
    _scheduler.start()
    logger.info("⏰ Scheduler iniciado")


def stop_scheduler():
    """Detener el scheduler"""
    global _scheduler
    
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None
        logger.info("⏰ Scheduler detenido")


def add_scheduled_jobs():
    """Agregar tareas programadas al scheduler"""
    scheduler = get_scheduler()
    
    # Tareas específicas de negocio desactivadas en esquema mínimo
    
    # Tarea cada 30 minutos: Limpiar datos temporales
    scheduler.add_job(
        cleanup_temp_data,
        IntervalTrigger(minutes=30),
        id="cleanup_temp_data",
        name="Limpiar datos temporales"
    )
    
    # Reportes desactivados
    
    # Tarea cada 15 minutos: Verificar salud del sistema
    scheduler.add_job(
        system_health_check,
        IntervalTrigger(minutes=15),
        id="system_health_check",
        name="Verificar salud del sistema"
    )

    # Tarea cada día: generar alertas 6/15/45 días
    scheduler.add_job(
        generate_time_based_alerts,
        CronTrigger(hour=7, minute=0),
        id="generate_time_based_alerts",
        name="Generar alertas 6/15/45 días"
    )
    
    logger.info("📅 Tareas programadas agregadas")


async def check_expired_quotations():
    return None


async def check_hot_quotations():
    return None


async def cleanup_temp_data():
    """Limpiar datos temporales"""
    try:
        # Aquí puedes agregar lógica para limpiar datos temporales
        # Por ejemplo, logs antiguos, archivos temporales, etc.
        logger.info("🧹 Limpieza de datos temporales completada")
        
    except Exception as e:
        logger.error(f"❌ Error en limpieza de datos temporales: {e}")


async def generate_weekly_reports():
    return None


async def system_health_check():
    """Verificar salud del sistema"""
    try:
        # Verificar conexión a base de datos
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        
        # Verificar conexión a Redis (opcional)
        # (implementar según tu configuración)
        
        logger.info("✅ Verificación de salud del sistema completada")
        
    except Exception as e:
        logger.error(f"❌ Error en verificación de salud del sistema: {e}")
        # Enviar alerta de sistema usando AlertService
        try:
            alert_service = AlertService(db=SessionLocal())
            alert_service.create_alert(
                tipo="sistema",
                mensaje=f"Error en verificación de salud: {e}",
                prioridad="alta",
                usuario_id=1  # Usuario sistema
            )
        except Exception as alert_error:
            logger.error(f"Error al crear alerta de sistema: {alert_error}")


def generate_time_based_alerts():
    """Generar alertas segun reglas de 6/15/45 días (frio/tibio/caliente)."""
    try:
        from datetime import date, timedelta
        db = SessionLocal()

        today = date.today()
        rules = {
            "frio": 45,
            "tibio": 15,
            "caliente": 6,
        }

        rows = db.query(Quotation.id_cotizacion, Quotation.estado, Quotation.fecha_registro, Quotation.fecha_seguimiento).all()
        created = 0
        for (qid, estado, fecha_registro, fecha_seguimiento) in rows:
            dias = rules.get(estado, 15)
            due = (fecha_registro or today) + timedelta(days=dias)
            # Si se venció o vence hoy y no hay alerta pendiente, crear
            exists = (
                db.query(Alert)
                .filter(Alert.id_cotizacion == qid)
                .filter(Alert.estado_alerta == "pendiente")
                .filter(Alert.fecha_alerta == due)
                .first()
            )
            if (due <= today) and not exists:
                AlertService.create_followup_alert(db, qid, due)
                created += 1

        db.close()
        logger.info(f"📨 Alertas por tiempo generadas: {created}")
    except Exception as e:
        logger.error(f"❌ Error generando alertas por tiempo: {e}")


async def send_expiration_notification(quotation: Quotation):
    return None


async def send_hot_quotation_alert(quotation: Quotation):
    return None


async def send_weekly_report(report_data: dict):
    return None


# Importar Optional aquí para evitar circular imports
from typing import Optional
