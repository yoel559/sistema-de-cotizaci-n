import json
from typing import Optional, Dict, Any

from ..core.config import settings
from ..websockets.manager import websocket_manager
from ..notifications.tasks import send_email_notification


class NotificationService:
    @staticmethod
    async def ws_broadcast(event_type: str, data: Dict[str, Any], subscription: str = "alerts"):
        try:
            await websocket_manager.broadcast({"type": event_type, "data": data}, subscription_type=subscription)
        except Exception:
            pass

    @staticmethod
    def email(to_email: str, subject: str, html: str) -> bool:
        try:
            if settings.sendgrid_api_key:
                send_email_notification.delay(to_email, subject, html)
                return True
        except Exception:
            return False
        return False


