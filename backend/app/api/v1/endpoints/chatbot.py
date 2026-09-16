"""
Endpoints para el Chatbot con Ollama
"""
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer
from pydantic import BaseModel

from ....services.chatbot_service import chatbot_service
from ....core.security import verify_token, get_current_active_user
from ....core.database import get_db
from ....models.user import User
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()


# Modelos Pydantic para requests/responses
class ChatMessage(BaseModel):
    message: str
    model: Optional[str] = None
    context: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    message: str
    model: str
    done: bool = True


class ChatContext(BaseModel):
    messages: List[dict]


@router.get("/status", response_model=dict)
async def get_chatbot_status():
    """Verifica el estado de la conexión con Ollama"""
    is_connected = await chatbot_service.check_ollama_connection()
    models = []
    error_message = None
    
    if is_connected:
        models = await chatbot_service.get_available_models()
        if not models:
            error_message = f"Ollama está conectado pero no hay modelos disponibles. Ejecuta: ollama pull {chatbot_service.default_model}"
    else:
        error_message = f"No se puede conectar a Ollama en {chatbot_service.ollama_url}. Verifica que Ollama esté instalado y corriendo (ollama serve)."
    
    return {
        "connected": is_connected,
        "available_models": models,
        "default_model": chatbot_service.default_model,
        "ollama_url": chatbot_service.ollama_url,
        "error": error_message
    }


@router.post("/chat", response_model=ChatResponse)
async def chat(
    chat_message: ChatMessage,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Envía un mensaje al chatbot y obtiene respuesta completa
    
    Requiere autenticación. Incluye contexto del usuario y detección de intenciones.
    """
    try:
        response = await chatbot_service.chat(
            message=chat_message.message,
            model=chat_message.model,
            context=chat_message.context,
            stream=False,
            db=db,
            user=current_user
        )
        
        if "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return ChatResponse(
            message=response.get("message", ""),
            model=response.get("model", chatbot_service.default_model),
            done=response.get("done", True)
        )
    except Exception as e:
        logger.error(f"Error en endpoint de chat: {e}")
        raise HTTPException(status_code=500, detail=f"Error al procesar el mensaje: {str(e)}")


@router.websocket("/chat/stream")
async def chat_stream(websocket: WebSocket):
    """
    WebSocket para chat con streaming de respuestas
    
    Permite recibir la respuesta del modelo palabra por palabra.
    Incluye contexto del usuario y detección de intenciones.
    """
    await websocket.accept()
    
    # Obtener token y usuario
    user = None
    db = None
    try:
        # Recibir token en el primer mensaje
        initial_data = await websocket.receive_json()
        token = initial_data.get("token")
        message = initial_data.get("message", "")
        model = initial_data.get("model")  # Puede ser None, null, o un string
        context = initial_data.get("context", [])
        
        # Log para depuración
        logger.info(f"WebSocket recibido - Modelo: {model}, Mensaje: {message[:50]}...")
        
        # Normalizar el modelo (None, null, o string vacío -> None)
        if not model or model == "null" or model == "":
            model = None
        
        # Obtener sesión de base de datos y autenticar usuario si hay token
        if token:
            payload = verify_token(token)
            if payload:
                from ....core.database import SessionLocal
                db = SessionLocal()
                try:
                    from ....services.user_service import UserService
                    user = UserService.get_user_by_id(db, payload.get("sub"))
                except Exception as e:
                    logger.warning(f"Error obteniendo usuario: {e}")
    except Exception as e:
        logger.warning(f"No se pudo autenticar usuario en WebSocket: {e}")
        message = initial_data.get("message", "") if 'initial_data' in locals() else ""
        model = initial_data.get("model") if 'initial_data' in locals() else None
        context = initial_data.get("context", []) if 'initial_data' in locals() else []
    
    try:
        if not message:
            await websocket.send_json({"error": "Mensaje vacío"})
            await websocket.close()
            if db:
                db.close()
            return
        
        # Enviar respuesta en streaming con contexto del usuario
        full_response = ""
        error_occurred = False
        
        # Log antes de llamar al servicio
        logger.info(f"Iniciando stream - Modelo: {model}, Mensaje: {message[:50]}...")
        
        try:
            async for chunk in chatbot_service.generate_response_stream(
                message=message,
                model=model,  # Puede ser None, el servicio lo detectará automáticamente
                context=context,
                db=db,
                user=user
            ):
                # Si el chunk es un error, enviarlo y salir
                if chunk.startswith("Error:"):
                    error_occurred = True
                    # Extraer el mensaje de error sin el prefijo "Error:"
                    error_message = chunk.replace("Error:", "").strip()
                    await websocket.send_json({
                        "error": error_message,
                        "done": True
                    })
                    break
                
                full_response += chunk
                await websocket.send_json({
                    "chunk": chunk,
                    "done": False
                })
            
            # Solo enviar señal de finalización si no hubo error
            if not error_occurred:
                await websocket.send_json({
                    "chunk": "",
                    "done": True,
                    "full_message": full_response
                })
        except Exception as stream_error:
            logger.error(f"Error en el stream: {stream_error}")
            error_occurred = True
            await websocket.send_json({
                "error": f"Error al procesar la respuesta: {str(stream_error)}",
                "done": True
            })
        
    except WebSocketDisconnect:
        logger.info("Cliente desconectado del chat")
    except Exception as e:
        logger.error(f"Error en WebSocket de chat: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "error": f"Error en el servidor: {str(e)}",
                "done": True
            })
        except:
            pass
    finally:
        try:
            if db:
                db.close()
            await websocket.close()
        except:
            pass


@router.get("/models", response_model=dict)
async def get_models():
    """Obtiene la lista de modelos disponibles en Ollama"""
    models = await chatbot_service.get_available_models()
    return {
        "models": models,
        "default": chatbot_service.default_model
    }


@router.post("/test")
async def test_chatbot():
    """Endpoint de prueba para verificar la conexión con Ollama"""
    try:
        # Obtener modelos disponibles
        models = await chatbot_service.get_available_models()
        model = models[0] if models else chatbot_service.default_model
        
        test_response = await chatbot_service.chat(
            message="hola",
            model=model,
            stream=False,
            db=None,
            user=None
        )
        
        if "error" in test_response:
            return {
                "success": False,
                "error": test_response["error"],
                "model_used": model,
                "ollama_url": chatbot_service.ollama_url
            }
        
        return {
            "success": True,
            "model_used": model,
            "response": test_response.get("message", "")[:100],
            "ollama_url": chatbot_service.ollama_url
        }
    except Exception as e:
        logger.error(f"Error en test: {e}", exc_info=True)
        return {
            "success": False,
            "error": str(e),
            "ollama_url": chatbot_service.ollama_url
        }

