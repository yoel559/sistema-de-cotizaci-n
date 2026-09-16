from fastapi import APIRouter, Depends
from ....core.database import get_db
from ....core.security import get_current_active_user
from ....services.notification_service import NotificationService


router = APIRouter()


@router.post("/test/ws")
async def test_ws(
    current_user = Depends(get_current_active_user)
):
    await NotificationService.ws_broadcast("test_notification", {"message": "hello"}, subscription="alerts")
    return {"ok": True}


