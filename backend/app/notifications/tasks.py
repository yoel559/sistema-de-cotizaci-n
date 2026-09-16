from celery import Celery
from ..core.config import settings
from .email_service import email_service


celery_app = Celery(
    "trading_tasks",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)


@celery_app.task(name="send_email_notification")
def send_email_notification(to_email: str, subject: str, html_content: str) -> bool:
    return email_service.send_email_sendgrid(to_email, subject, html_content)


@celery_app.task(name="send_weekly_report_email")
def send_weekly_report_email(html_content: str, to_email: str = "admin@trading-system.com") -> bool:
    subject = "Reporte Semanal - Sistema de Trading"
    return email_service.send_email_sendgrid(to_email, subject, html_content)


