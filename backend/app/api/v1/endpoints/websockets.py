import json
import asyncio
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import HTTPBearer

from ....websockets.manager import websocket_manager
from ....core.security import verify_token
from ....core.database import get_db
from ....services.user_service import UserService

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


@router.websocket("/test/{test_id}")
async def websocket_test(websocket: WebSocket, test_id: int):
    """WebSocket de prueba simple sin autenticación"""
    logger.info("🧪 Conexión WebSocket de prueba iniciada desde %s para test_id %s", websocket.client, test_id)

    try:
        # Usar el mismo método que el endpoint de notificaciones
        result = await websocket_manager.connect(websocket, 999)  # Usuario de prueba
        if result is not None:
            logger.warning(f"🚫 Conexión WebSocket de prueba rechazada: {result}")
            return
        logger.info("✅ WebSocket de prueba aceptado")

        await websocket.send_text(json.dumps({
            "type": "test",
            "message": "Conexión WebSocket de prueba exitosa",
            "timestamp": str(datetime.utcnow())
        }))

        # Esperar un mensaje del cliente
        try:
            data = await asyncio.wait_for(websocket.receive_text(), timeout=10)
            message = json.loads(data)
            logger.info(f"📨 Mensaje recibido en WebSocket de prueba: {message}")

            await websocket.send_text(json.dumps({
                "type": "echo",
                "message": f"Echo: {message}",
                "timestamp": str(datetime.utcnow())
            }))
        except asyncio.TimeoutError:
            logger.info("⏰ Timeout en WebSocket de prueba")
            await websocket.send_text(json.dumps({
                "type": "timeout",
                "message": "No se recibió mensaje en 10 segundos",
                "timestamp": str(datetime.utcnow())
            }))

    except Exception as e:
        logger.error(f"❌ Error en WebSocket de prueba: {e}")

    finally:
        try:
            await websocket.close()
            logger.info("🔚 WebSocket de prueba cerrado")
        except:
            pass


@router.websocket("/notifications/{user_id}")
async def websocket_notifications(websocket: WebSocket, user_id: int):
    """WebSocket para notificaciones en tiempo real"""
    logger.info(f"🔌 Nueva conexión WebSocket para usuario {user_id} desde {websocket.client}")

    try:
        result = await websocket_manager.connect(websocket, user_id)
        if result is not None:
            logger.warning(f"🚫 Conexión WebSocket rechazada para usuario {user_id}: {result}")
            return
        logger.info(f"✅ WebSocket conectado exitosamente para usuario {user_id}")

        # Enviar mensaje de bienvenida
        await websocket.send_text(json.dumps({
            "type": "welcome",
            "message": f"Conectado como usuario {user_id}",
            "timestamp": str(datetime.utcnow())
        }))

        # Configurar timeout para evitar bucles infinitos
        ping_interval = 30  # segundos
        last_ping = datetime.utcnow()
        connection_active = True

        while connection_active:
            try:
                # Esperar mensajes del cliente con timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=ping_interval)

                if data:
                    message = json.loads(data)
                    logger.debug(f"📨 Mensaje recibido de usuario {user_id}: {message.get('type', 'unknown')}")

                    # Actualizar actividad
                    websocket_manager.last_activity[websocket] = datetime.utcnow()

                    # Procesar mensaje según el tipo
                    if message.get("type") == "subscribe":
                        subscription_type = message.get("subscription_type", "alerts")
                        websocket_manager.subscribe(websocket, subscription_type)

                        # Confirmar suscripción
                        await websocket.send_text(json.dumps({
                            "type": "subscription_confirmed",
                            "subscription_type": subscription_type,
                            "timestamp": str(datetime.utcnow())
                        }))
                        logger.info(f"📡 Usuario {user_id} suscrito a {subscription_type}")

                    elif message.get("type") == "unsubscribe":
                        subscription_type = message.get("subscription_type", "alerts")
                        websocket_manager.unsubscribe(websocket, subscription_type)

                        # Confirmar desuscripción
                        await websocket.send_text(json.dumps({
                            "type": "unsubscription_confirmed",
                            "subscription_type": subscription_type,
                            "timestamp": str(datetime.utcnow())
                        }))
                        logger.info(f"📡 Usuario {user_id} desuscrito de {subscription_type}")

                    elif message.get("type") == "ping":
                        # Responder pong para mantener conexión
                        await websocket.send_text(json.dumps({
                            "type": "pong",
                            "timestamp": str(datetime.utcnow())
                        }))
                        last_ping = datetime.utcnow()

                    elif message.get("type") == "pong":
                        # Cliente respondió a nuestro ping
                        last_ping = datetime.utcnow()
                        logger.debug(f"🏓 Pong recibido de usuario {user_id}")

                    # Verificar si la conexión está inactiva demasiado tiempo
                    if (datetime.utcnow() - last_ping).seconds > ping_interval * 2:
                        logger.warning(f"⏰ Conexión inactiva para usuario {user_id}, cerrando...")
                        connection_active = False
                        break

            except asyncio.TimeoutError:
                # Enviar ping para mantener conexión viva
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": str(datetime.utcnow())
                    }))
                    logger.debug(f"🏓 Ping enviado a usuario {user_id}")
                except Exception as e:
                    logger.error(f"❌ Error enviando ping a usuario {user_id}: {e}")
                    connection_active = False
                    break

            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Mensaje JSON inválido de usuario {user_id}: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Mensaje JSON inválido",
                    "timestamp": str(datetime.utcnow())
                }))

            except Exception as e:
                logger.error(f"❌ Error procesando mensaje de usuario {user_id}: {e}")
                connection_active = False
                break

    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket desconectado normalmente para usuario {user_id}")

    except Exception as e:
        logger.error(f"❌ Error inesperado en WebSocket para usuario {user_id}: {e}")

    finally:
        # Asegurar que la desconexión se maneje correctamente
        try:
            websocket_manager.disconnect(websocket, user_id)
            logger.info(f"🧹 Limpieza completada para usuario {user_id}")
        except Exception as e:
            logger.error(f"❌ Error en limpieza de WebSocket para usuario {user_id}: {e}")


@router.websocket("/quotations")
async def websocket_quotations(websocket: WebSocket):
    """WebSocket para actualizaciones de cotizaciones"""
    logger.info("🔌 Nueva conexión WebSocket para cotizaciones")

    try:
        await websocket.accept()
        websocket_manager.subscribe(websocket, "quotations")
        logger.info("✅ WebSocket de cotizaciones conectado y suscrito")

        # Enviar mensaje de bienvenida
        await websocket.send_text(json.dumps({
            "type": "welcome",
            "message": "Conectado al canal de cotizaciones",
            "timestamp": str(datetime.utcnow())
        }))

        # Configurar timeout
        ping_interval = 30
        last_activity = datetime.utcnow()
        connection_active = True

        while connection_active:
            try:
                # Esperar mensajes con timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=ping_interval)

                if data:
                    message = json.loads(data)
                    logger.debug(f"📨 Mensaje en canal cotizaciones: {message.get('type', 'unknown')}")
                    last_activity = datetime.utcnow()

                    # Actualizar actividad en el manager global
                    if hasattr(websocket_manager, 'last_activity'):
                        websocket_manager.last_activity[websocket] = datetime.utcnow()

                    if message.get("type") == "ping":
                        await websocket.send_text(json.dumps({
                            "type": "pong",
                            "timestamp": str(datetime.utcnow())
                        }))

                    elif message.get("type") == "pong":
                        last_activity = datetime.utcnow()

                # Verificar inactividad
                if (datetime.utcnow() - last_activity).seconds > ping_interval * 2:
                    logger.warning("⏰ Conexión de cotizaciones inactiva, cerrando...")
                    connection_active = False
                    break

            except asyncio.TimeoutError:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": str(datetime.utcnow())
                    }))
                    logger.debug("🏓 Ping enviado a canal cotizaciones")
                except Exception as e:
                    logger.error(f"❌ Error enviando ping a cotizaciones: {e}")
                    connection_active = False
                    break

            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Mensaje JSON inválido en cotizaciones: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Mensaje JSON inválido",
                    "timestamp": str(datetime.utcnow())
                }))

            except Exception as e:
                logger.error(f"❌ Error en WebSocket cotizaciones: {e}")
                connection_active = False
                break

    except WebSocketDisconnect:
        logger.info("🔌 WebSocket de cotizaciones desconectado normalmente")

    except Exception as e:
        logger.error(f"❌ Error inesperado en WebSocket cotizaciones: {e}")

    finally:
        try:
            websocket_manager.unsubscribe(websocket, "quotations")
            logger.info("🧹 Limpieza completada para WebSocket cotizaciones")
        except Exception as e:
            logger.error(f"❌ Error en limpieza de WebSocket cotizaciones: {e}")


@router.websocket("/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket para alertas del sistema"""
    logger.info("🔌 Nueva conexión WebSocket para alertas")

    try:
        await websocket.accept()
        websocket_manager.subscribe(websocket, "alerts")
        logger.info("✅ WebSocket de alertas conectado y suscrito")

        # Enviar mensaje de bienvenida
        await websocket.send_text(json.dumps({
            "type": "welcome",
            "message": "Conectado al canal de alertas",
            "timestamp": str(datetime.utcnow())
        }))

        # Configurar timeout
        ping_interval = 30
        last_activity = datetime.utcnow()
        connection_active = True

        while connection_active:
            try:
                # Esperar mensajes con timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=ping_interval)

                if data:
                    message = json.loads(data)
                    logger.debug(f"📨 Mensaje en canal alertas: {message.get('type', 'unknown')}")
                    last_activity = datetime.utcnow()

                    # Actualizar actividad en el manager global
                    if hasattr(websocket_manager, 'last_activity'):
                        websocket_manager.last_activity[websocket] = datetime.utcnow()

                    if message.get("type") == "ping":
                        await websocket.send_text(json.dumps({
                            "type": "pong",
                            "timestamp": str(datetime.utcnow())
                        }))

                    elif message.get("type") == "pong":
                        last_activity = datetime.utcnow()

                # Verificar inactividad
                if (datetime.utcnow() - last_activity).seconds > ping_interval * 2:
                    logger.warning("⏰ Conexión de alertas inactiva, cerrando...")
                    connection_active = False
                    break

            except asyncio.TimeoutError:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": str(datetime.utcnow())
                    }))
                    logger.debug("🏓 Ping enviado a canal alertas")
                except Exception as e:
                    logger.error(f"❌ Error enviando ping a alertas: {e}")
                    connection_active = False
                    break

            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Mensaje JSON inválido en alertas: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Mensaje JSON inválido",
                    "timestamp": str(datetime.utcnow())
                }))

            except Exception as e:
                logger.error(f"❌ Error en WebSocket alertas: {e}")
                connection_active = False
                break

    except WebSocketDisconnect:
        logger.info("🔌 WebSocket de alertas desconectado normalmente")

    except Exception as e:
        logger.error(f"❌ Error inesperado en WebSocket alertas: {e}")

    finally:
        try:
            websocket_manager.unsubscribe(websocket, "alerts")
            logger.info("🧹 Limpieza completada para WebSocket alertas")
        except Exception as e:
            logger.error(f"❌ Error en limpieza de WebSocket alertas: {e}")


@router.websocket("/analytics")
async def websocket_analytics(websocket: WebSocket):
    """WebSocket para analytics en tiempo real"""
    logger.info("🔌 Nueva conexión WebSocket para analytics")

    try:
        await websocket.accept()
        websocket_manager.subscribe(websocket, "analytics")
        logger.info("✅ WebSocket de analytics conectado y suscrito")

        # Enviar mensaje de bienvenida
        await websocket.send_text(json.dumps({
            "type": "welcome",
            "message": "Conectado al canal de analytics",
            "timestamp": str(datetime.utcnow())
        }))

        # Configurar timeout
        ping_interval = 30
        last_activity = datetime.utcnow()
        connection_active = True

        while connection_active:
            try:
                # Esperar mensajes con timeout
                data = await asyncio.wait_for(websocket.receive_text(), timeout=ping_interval)

                if data:
                    message = json.loads(data)
                    logger.debug(f"📨 Mensaje en canal analytics: {message.get('type', 'unknown')}")
                    last_activity = datetime.utcnow()

                    # Actualizar actividad en el manager global
                    if hasattr(websocket_manager, 'last_activity'):
                        websocket_manager.last_activity[websocket] = datetime.utcnow()

                    if message.get("type") == "ping":
                        await websocket.send_text(json.dumps({
                            "type": "pong",
                            "timestamp": str(datetime.utcnow())
                        }))

                    elif message.get("type") == "pong":
                        last_activity = datetime.utcnow()

                # Verificar inactividad
                if (datetime.utcnow() - last_activity).seconds > ping_interval * 2:
                    logger.warning("⏰ Conexión de analytics inactiva, cerrando...")
                    connection_active = False
                    break

            except asyncio.TimeoutError:
                try:
                    await websocket.send_text(json.dumps({
                        "type": "ping",
                        "timestamp": str(datetime.utcnow())
                    }))
                    logger.debug("🏓 Ping enviado a canal analytics")
                except Exception as e:
                    logger.error(f"❌ Error enviando ping a analytics: {e}")
                    connection_active = False
                    break

            except json.JSONDecodeError as e:
                logger.warning(f"⚠️ Mensaje JSON inválido en analytics: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Mensaje JSON inválido",
                    "timestamp": str(datetime.utcnow())
                }))

            except Exception as e:
                logger.error(f"❌ Error en WebSocket analytics: {e}")
                connection_active = False
                break

    except WebSocketDisconnect:
        logger.info("🔌 WebSocket de analytics desconectado normalmente")

    except Exception as e:
        logger.error(f"❌ Error inesperado en WebSocket analytics: {e}")

    finally:
        try:
            websocket_manager.unsubscribe(websocket, "analytics")
            logger.info("🧹 Limpieza completada para WebSocket analytics")
        except Exception as e:
            logger.error(f"❌ Error en limpieza de WebSocket analytics: {e}")


@router.get("/connections/stats")
async def get_connection_stats():
    """Obtener estadísticas de conexiones WebSocket"""
    return websocket_manager.get_connection_count()


@router.post("/cleanup")
async def force_websocket_cleanup():
    """Forzar limpieza de conexiones WebSocket inactivas"""
    cleaned_count = await websocket_manager.force_cleanup()
    stats = websocket_manager.get_connection_count()
    return {
        "status": "success",
        "cleaned_connections": cleaned_count,
        "current_stats": stats,
        "message": f"Se limpiaron {cleaned_count} conexiones inactivas"
    }

@router.get("/stats/detailed")
async def get_detailed_stats():
    """Obtener estadísticas detalladas de WebSocket"""
    stats = websocket_manager.get_connection_count()
    current_time = datetime.utcnow()

    # Agregar información detallada
    detailed_stats = {
        **stats,
        "inactive_connections": len([
            ws for ws, last_activity in websocket_manager.last_activity.items()
            if (current_time - last_activity).seconds > 300  # 5 minutos
        ]),
        "active_connections_detail": {
            user_id: len(connections)
            for user_id, connections in websocket_manager.active_connections.items()
        },
        "last_cleanup": getattr(websocket_manager, '_last_cleanup', None),
        "auto_cleanup_active": websocket_manager.cleanup_task is not None and not websocket_manager.cleanup_task.done()
    }

    return detailed_stats

@router.post("/test/notification")
async def test_notification(user_id: Optional[int] = None, subscription_type: str = "alerts"):
    """
    Endpoint de prueba para enviar notificaciones WebSocket.
    Útil para probar la conexión WebSocket.
    """
    from datetime import datetime
    
    test_message = {
        "type": "test_notification",
        "data": {
            "message": "Esta es una notificación de prueba",
            "timestamp": str(datetime.utcnow()),
            "test": True
        },
        "timestamp": str(datetime.utcnow())
    }
    
    if user_id:
        # Enviar mensaje personal a un usuario específico
        await websocket_manager.send_personal_message(test_message, user_id)
        return {
            "status": "success",
            "message": f"Notificación de prueba enviada al usuario {user_id}",
            "user_id": user_id
        }
    else:
        # Broadcast a todos los suscritos
        await websocket_manager.broadcast(test_message, subscription_type)
        return {
            "status": "success",
            "message": f"Notificación de prueba enviada a todos los suscritos a {subscription_type}",
            "subscription_type": subscription_type,
            "stats": websocket_manager.get_connection_count()
        }


