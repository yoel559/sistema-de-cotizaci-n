import logging
from typing import List, Optional
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

from ..core.config import settings

logger = logging.getLogger(__name__)


class SMSService:
    def __init__(self):
        self.twilio_client = None
        if settings.twilio_account_sid and settings.twilio_auth_token:
            self.twilio_client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
    
    def send_sms(self, to_number: str, message: str, from_number: str = None) -> bool:
        """Enviar SMS usando Twilio"""
        try:
            if not self.twilio_client:
                logger.error("❌ Twilio no configurado")
                return False
            
            # Usar número por defecto si no se especifica
            if not from_number:
                from_number = "+1234567890"  # Número de Twilio configurado
            
            message = self.twilio_client.messages.create(
                body=message,
                from_=from_number,
                to=to_number
            )
            
            logger.info(f"✅ SMS enviado via Twilio: {message.sid}")
            return True
            
        except TwilioException as e:
            logger.error(f"❌ Error de Twilio al enviar SMS: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Error inesperado al enviar SMS: {e}")
            return False
    
    def send_quotation_alert(self, to_number: str, quotation_number: str, total_amount: float) -> bool:
        """Enviar alerta de cotización por SMS"""
        message = f"🚨 Nueva cotización {quotation_number} creada por ${total_amount:,.2f}. Revisar sistema."
        return self.send_sms(to_number, message)
    
    def send_status_change_alert(self, to_number: str, quotation_number: str, new_status: str) -> bool:
        """Enviar alerta de cambio de estado por SMS"""
        message = f"📊 Cotización {quotation_number} cambió a estado: {new_status}"
        return self.send_sms(to_number, message)
    
    def send_high_priority_alert(self, to_number: str, alert_type: str, message: str) -> bool:
        """Enviar alerta de alta prioridad por SMS"""
        sms_message = f"🚨 ALERTA CRÍTICA: {alert_type} - {message}"
        return self.send_sms(to_number, sms_message)
    
    def send_bulk_sms(self, to_numbers: List[str], message: str) -> dict:
        """Enviar SMS masivo"""
        results = {
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for number in to_numbers:
            try:
                if self.send_sms(number, message):
                    results["success"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].append(f"Error enviando a {number}")
            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"Error enviando a {number}: {str(e)}")
        
        logger.info(f"📱 SMS masivo completado: {results['success']} exitosos, {results['failed']} fallidos")
        return results
    
    def send_whatsapp_message(self, to_number: str, message: str) -> bool:
        """Enviar mensaje de WhatsApp usando Twilio"""
        try:
            if not self.twilio_client:
                logger.error("❌ Twilio no configurado")
                return False
            
            # Formato para WhatsApp: whatsapp:+1234567890
            whatsapp_number = f"whatsapp:{to_number}"
            from_whatsapp = "whatsapp:+1234567890"  # Número de WhatsApp configurado
            
            message = self.twilio_client.messages.create(
                body=message,
                from_=from_whatsapp,
                to=whatsapp_number
            )
            
            logger.info(f"✅ WhatsApp enviado via Twilio: {message.sid}")
            return True
            
        except TwilioException as e:
            logger.error(f"❌ Error de Twilio al enviar WhatsApp: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Error inesperado al enviar WhatsApp: {e}")
            return False


# Instancia global del servicio de SMS
sms_service = SMSService()
