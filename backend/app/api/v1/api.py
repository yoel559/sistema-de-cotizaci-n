from fastapi import APIRouter

from .endpoints import auth, users, clients, quotations, websockets, alerts, documents, credit, payments, inventory, notifications, reports, seeders, chatbot

api_router = APIRouter()

# Incluir todos los endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(quotations.router, prefix="/quotations", tags=["quotations"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(websockets.router, prefix="/ws", tags=["websockets"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(credit.router, prefix="/credit", tags=["credit"])
api_router.include_router(payments.router, prefix="/billing", tags=["billing"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(seeders.router, prefix="/seeders", tags=["seeders"])
api_router.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
