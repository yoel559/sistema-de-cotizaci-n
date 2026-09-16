import json
import logging
import asyncio
from typing import Dict, Set, Optional
from fastapi import WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Conexiones activas por usuario (máximo 3 por usuario)
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Conexiones por tipo de suscripción
        self.subscriptions: Dict[str, Set[WebSocket]] = {
            "quotations": set(),
            "alerts": set(),
            "analytics": set()
        }
        # Límite de conexiones por usuario
        self.max_connections_per_user = 3
        # Última actividad por conexión
        self.last_activity: Dict[WebSocket, datetime] = {}
        # Tarea de limpieza automática
        self.cleanup_task = None
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Conectar un WebSocket con límites de conexión"""
        # Verificar límite de conexiones por usuario
        if user_id in self.active_connections:
            if len(self.active_connections[user_id]) >= self.max_connections_per_user:
                logger.warning(f"🚫 Límite de conexiones alcanzado para usuario {user_id}")
                await websocket.close(code=1008, reason="Connection limit exceeded")
                return "Connection limit exceeded"

            # Verificar si ya existe una conexión desde el mismo cliente
            client_host = getattr(websocket, 'client', None)
            if client_host:
                for existing_ws in self.active_connections[user_id]:
                    existing_host = getattr(existing_ws, 'client', None)
                    if existing_host == client_host:
                        logger.warning(f"🚫 Conexión duplicada rechazada para usuario {user_id}")
                        await websocket.close(code=1008, reason="Duplicate connection")
                        return "Duplicate connection"
        else:
            self.active_connections[user_id] = set()

        await websocket.accept()
        self.active_connections[user_id].add(websocket)
        self.last_activity[websocket] = datetime.utcnow()

        # Iniciar limpieza automática si no está activa
        if self.cleanup_task is None or self.cleanup_task.done():
            self.cleanup_task = asyncio.create_task(self._auto_cleanup())

        logger.info(f"🔌 WebSocket conectado para usuario {user_id} ({len(self.active_connections[user_id])} conexiones activas)")
        return None  # Conexión exitosa
    
    def disconnect(self, websocket: WebSocket, user_id: int):
        """Desconectar un WebSocket"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

        # Remover de todas las suscripciones
        for subscription_set in self.subscriptions.values():
            subscription_set.discard(websocket)

        # Limpiar registro de actividad
        self.last_activity.pop(websocket, None)

        logger.info(f"🔌 WebSocket desconectado para usuario {user_id}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Enviar mensaje personal a un usuario específico"""
        if user_id in self.active_connections:
            disconnected_websockets = set()

            for websocket in self.active_connections[user_id]:
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_text(json.dumps(message))
                        self.last_activity[websocket] = datetime.utcnow()  # Actualizar actividad
                    else:
                        disconnected_websockets.add(websocket)
                except Exception as e:
                    logger.error(f"❌ Error enviando mensaje personal: {e}")
                    disconnected_websockets.add(websocket)

            # Limpiar conexiones desconectadas
            for websocket in disconnected_websockets:
                self.disconnect(websocket, user_id)
    
    async def broadcast(self, message: dict, subscription_type: str = "alerts"):
        """Enviar mensaje a todas las conexiones suscritas a un tipo específico"""
        if subscription_type in self.subscriptions:
            disconnected_websockets = set()

            for websocket in self.subscriptions[subscription_type]:
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_text(json.dumps(message))
                        self.last_activity[websocket] = datetime.utcnow()  # Actualizar actividad
                    else:
                        disconnected_websockets.add(websocket)
                except Exception as e:
                    logger.error(f"❌ Error enviando broadcast: {e}")
                    disconnected_websockets.add(websocket)

            # Limpiar conexiones desconectadas
            for websocket in disconnected_websockets:
                # Encontrar y remover de todas las suscripciones
                for subscription_set in self.subscriptions.values():
                    subscription_set.discard(websocket)
    
    def subscribe(self, websocket: WebSocket, subscription_type: str):
        """Suscribir un WebSocket a un tipo de notificación"""
        if subscription_type in self.subscriptions:
            self.subscriptions[subscription_type].add(websocket)
            logger.info(f"📡 WebSocket suscrito a {subscription_type}")
    
    def unsubscribe(self, websocket: WebSocket, subscription_type: str):
        """Desuscribir un WebSocket de un tipo de notificación"""
        if subscription_type in self.subscriptions:
            self.subscriptions[subscription_type].discard(websocket)
            logger.info(f"📡 WebSocket desuscrito de {subscription_type}")
    
    async def send_quotation_notification(self, user_id: int, quotation_data: dict):
        """Enviar notificación de cotización"""
        message = {
            "type": "quotation_notification",
            "data": quotation_data,
            "timestamp": str(datetime.utcnow())
        }
        await self.send_personal_message(message, user_id)
    
    async def send_alert_notification(self, user_id: int, alert_data: dict):
        """Enviar notificación de alerta"""
        message = {
            "type": "alert_notification",
            "data": alert_data,
            "timestamp": str(datetime.utcnow())
        }
        await self.send_personal_message(message, user_id)
    
    async def broadcast_quotation_update(self, quotation_data: dict):
        """Transmitir actualización de cotización a todos los suscritos"""
        message = {
            "type": "quotation_update",
            "data": quotation_data,
            "timestamp": str(datetime.utcnow())
        }
        await self.broadcast(message, "quotations")
    
    async def broadcast_alert(self, alert_data: dict):
        """Transmitir alerta a todos los suscritos"""
        message = {
            "type": "alert",
            "data": alert_data,
            "timestamp": str(datetime.utcnow())
        }
        await self.broadcast(message, "alerts")
    
    async def broadcast_analytics(self, analytics_data: dict):
        """Transmitir analytics en tiempo real"""
        message = {
            "type": "analytics",
            "data": analytics_data,
            "timestamp": str(datetime.utcnow())
        }
        await self.broadcast(message, "analytics")
    
    async def _auto_cleanup(self):
        """Limpieza automática de conexiones inactivas cada 60 segundos"""
        while True:
            try:
                await asyncio.sleep(60)  # Ejecutar cada minuto

                current_time = datetime.utcnow()
                inactive_threshold = 300  # 5 minutos de inactividad
                cleaned_count = 0

                # Revisar conexiones inactivas
                websockets_to_remove = []
                for websocket, last_activity in self.last_activity.items():
                    if (current_time - last_activity).seconds > inactive_threshold:
                        websockets_to_remove.append(websocket)

                # Cerrar conexiones inactivas
                for websocket in websockets_to_remove:
                    try:
                        if websocket.client_state == WebSocketState.CONNECTED:
                            await websocket.close(code=1000, reason="Inactive connection")
                        cleaned_count += 1
                    except Exception as e:
                        logger.debug(f"Error cerrando conexión inactiva: {e}")

                    # Limpiar registros
                    for user_id, connections in self.active_connections.items():
                        if websocket in connections:
                            self.disconnect(websocket, user_id)
                            break

                if cleaned_count > 0:
                    logger.info(f"🧹 Limpieza automática: {cleaned_count} conexiones inactivas cerradas")

            except asyncio.CancelledError:
                logger.info("🧹 Limpieza automática cancelada")
                break
            except Exception as e:
                logger.error(f"❌ Error en limpieza automática: {e}")
                await asyncio.sleep(30)  # Esperar antes de reintentar

    async def force_cleanup(self):
        """Forzar limpieza de todas las conexiones inactivas"""
        current_time = datetime.utcnow()
        inactive_threshold = 60  # 1 minuto para limpieza forzada
        cleaned_count = 0

        websockets_to_remove = []
        for websocket, last_activity in self.last_activity.items():
            if (current_time - last_activity).seconds > inactive_threshold:
                websockets_to_remove.append(websocket)

        for websocket in websockets_to_remove:
            try:
                if websocket.client_state == WebSocketState.CONNECTED:
                    await websocket.close(code=1000, reason="Connection cleaned")
                cleaned_count += 1
            except Exception as e:
                logger.debug(f"Error forzando cierre: {e}")

            # Limpiar registros
            for user_id, connections in self.active_connections.items():
                if websocket in connections:
                    self.disconnect(websocket, user_id)
                    break

        logger.info(f"🧹 Limpieza forzada: {cleaned_count} conexiones cerradas")
        return cleaned_count

    def get_connection_count(self) -> Dict[str, int]:
        """Obtener estadísticas de conexiones"""
        return {
            "total_users": len(self.active_connections),
            "total_connections": sum(len(connections) for connections in self.active_connections.values()),
            "subscriptions": {
                subscription_type: len(websockets)
                for subscription_type, websockets in self.subscriptions.items()
            }
        }


# Instancia global del gestor de conexiones
websocket_manager = ConnectionManager()


# Importar datetime aquí para evitar circular imports
from datetime import datetime


def safe_broadcast(message: dict, subscription_type: str = "alerts"):
    """
    Función helper para enviar broadcasts desde código síncrono.
    Usa el event loop de forma más segura.
    """
    try:
        # Intentar obtener el event loop actual
        try:
            loop = asyncio.get_running_loop()
            # Si hay un loop corriendo, crear una tarea (se ejecutará en background)
            asyncio.create_task(websocket_manager.broadcast(message, subscription_type))
        except RuntimeError:
            # No hay loop corriendo, intentar obtener uno existente
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                # Si el loop no está corriendo, ejecutarlo
                if not loop.is_running():
                    loop.run_until_complete(websocket_manager.broadcast(message, subscription_type))
                else:
                    # Si está corriendo, crear tarea
                    asyncio.create_task(websocket_manager.broadcast(message, subscription_type))
            except RuntimeError:
                # No hay loop, crear uno nuevo y ejecutar
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(websocket_manager.broadcast(message, subscription_type))
                finally:
                    if not loop.is_closed():
                        loop.close()
    except Exception as e:
        logger.error(f"Error enviando broadcast WebSocket: {e}", exc_info=True)


def safe_send_personal_message(message: dict, user_id: int):
    """
    Función helper para enviar mensajes personales desde código síncrono.
    Usa el event loop de forma más segura.
    """
    try:
        # Intentar obtener el event loop actual
        try:
            loop = asyncio.get_running_loop()
            # Si hay un loop corriendo, crear una tarea (se ejecutará en background)
            asyncio.create_task(websocket_manager.send_personal_message(message, user_id))
        except RuntimeError:
            # No hay loop corriendo, intentar obtener uno existente
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                # Si el loop no está corriendo, ejecutarlo
                if not loop.is_running():
                    loop.run_until_complete(websocket_manager.send_personal_message(message, user_id))
                else:
                    # Si está corriendo, crear tarea
                    asyncio.create_task(websocket_manager.send_personal_message(message, user_id))
            except RuntimeError:
                # No hay loop, crear uno nuevo y ejecutar
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    loop.run_until_complete(websocket_manager.send_personal_message(message, user_id))
                finally:
                    if not loop.is_closed():
                        loop.close()
    except Exception as e:
        logger.error(f"Error enviando mensaje personal WebSocket: {e}", exc_info=True)
