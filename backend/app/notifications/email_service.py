import logging
from typing import List, Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content, HtmlContent
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib

from ..core.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.sendgrid_client = None
        if settings.sendgrid_api_key:
            self.sendgrid_client = SendGridAPIClient(api_key=settings.sendgrid_api_key)
    
    def send_email_sendgrid(self, to_email: str, subject: str, html_content: str, from_email: str = "noreply@trading-system.com") -> bool:
        """Enviar email usando SendGrid"""
        try:
            if not self.sendgrid_client:
                logger.error("❌ SendGrid no configurado")
                return False
            
            message = Mail(
                from_email=from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content
            )
            
            response = self.sendgrid_client.send(message)
            logger.info(f"✅ Email enviado via SendGrid: {response.status_code}")
            return response.status_code == 202
            
        except Exception as e:
            logger.error(f"❌ Error al enviar email via SendGrid: {e}")
            return False
    
    def send_quotation_notification(self, to_email: str, quotation_number: str, client_name: str, total_amount: float) -> bool:
        """Enviar notificación de cotización creada"""
        subject = f"Nueva Cotización: {quotation_number}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Nueva Cotización Creada</h2>
            <p><strong>Número:</strong> {quotation_number}</p>
            <p><strong>Cliente:</strong> {client_name}</p>
            <p><strong>Total:</strong> ${total_amount:,.2f}</p>
            <p>La cotización ha sido creada exitosamente y está lista para revisión.</p>
            <br>
            <p>Saludos,<br>Sistema de Trading</p>
        </body>
        </html>
        """
        
        return self.send_email_sendgrid(to_email, subject, html_content)
    
    def send_status_change_notification(self, to_email: str, quotation_number: str, old_status: str, new_status: str) -> bool:
        """Enviar notificación de cambio de estado"""
        subject = f"Cambio de Estado - Cotización {quotation_number}"
        
        html_content = f"""
        <html>
        <body>
            <h2>Cambio de Estado en Cotización</h2>
            <p><strong>Número:</strong> {quotation_number}</p>
            <p><strong>Estado Anterior:</strong> {old_status}</p>
            <p><strong>Nuevo Estado:</strong> {new_status}</p>
            <p>El estado de la cotización ha sido actualizado.</p>
            <br>
            <p>Saludos,<br>Sistema de Trading</p>
        </body>
        </html>
        """
        
        return self.send_email_sendgrid(to_email, subject, html_content)
    
    def send_alert_notification(self, to_email: str, alert_type: str, message: str, priority: str = "normal") -> bool:
        """Enviar notificación de alerta"""
        subject = f"Alerta del Sistema - {alert_type}"
        
        priority_color = "red" if priority == "high" else "orange" if priority == "medium" else "blue"
        
        html_content = f"""
        <html>
        <body>
            <h2 style="color: {priority_color};">Alerta del Sistema</h2>
            <p><strong>Tipo:</strong> {alert_type}</p>
            <p><strong>Prioridad:</strong> {priority}</p>
            <p><strong>Mensaje:</strong> {message}</p>
            <br>
            <p>Saludos,<br>Sistema de Trading</p>
        </body>
        </html>
        """
        
        return self.send_email_sendgrid(to_email, subject, html_content)
    
    def send_bulk_notification(self, to_emails: List[str], subject: str, html_content: str) -> dict:
        """Enviar notificación masiva"""
        results = {
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for email in to_emails:
            try:
                if self.send_email_sendgrid(email, subject, html_content):
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append(f"Error enviando a {email}")
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Error enviando a {email}: {str(e)}")
        
        logger.info(f"📧 Notificación masiva completada: {results['success']} exitosas, {results['failed']} fallidas")
        return results


# Instancia global del servicio de email
email_service = EmailService()
