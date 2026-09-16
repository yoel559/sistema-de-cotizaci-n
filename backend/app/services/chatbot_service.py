"""
Servicio de Chatbot con Ollama (Llama 3 / Mistral)
Ejecuta modelos de lenguaje localmente usando Ollama
Incluye contexto del usuario e integración con lógica de negocio
"""
import httpx
import logging
import json
from json import JSONDecodeError
from typing import Optional, AsyncGenerator, Dict, Any
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.user import User
from ..services.quotation_service import QuotationService
from ..services.client_service import ClientService

logger = logging.getLogger(__name__)


class ChatbotService:
    """Servicio para interactuar con Ollama localmente"""
    
    def __init__(self):
        # URL base de Ollama (por defecto localhost:11434)
        self.ollama_url = getattr(settings, 'ollama_url', 'http://localhost:11434')
        # Modelo por defecto (phi3:mini, llama3, mistral, llama3.2, etc.)
        self.default_model = getattr(settings, 'ollama_model', 'phi3:mini')
        self.timeout = 120.0  # Timeout para requests largos
        
        # Verificar si hay modelos portables disponibles
        self.portable_models_path = getattr(settings, 'ollama_models_path', None)
        if self.portable_models_path:
            logger.info(f"Modo portable activado. Modelos en: {self.portable_models_path}")
        
        # El modelo se detectará automáticamente cuando se use
        
    async def check_ollama_connection(self) -> bool:
        """Verifica si Ollama está disponible"""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.ollama_url}/api/tags")
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Error conectando con Ollama: {e}")
            return False
    
    async def _get_or_detect_model(self, model: Optional[str] = None) -> str:
        """Obtiene el modelo a usar, detectando automáticamente si es necesario"""
        if model:
            # Verificar que el modelo especificado esté disponible
            models = await self.get_available_models()
            if models and model not in models:
                logger.warning(f"Modelo '{model}' no está disponible. Modelos disponibles: {models}")
                if models:
                    logger.info(f"Usando modelo disponible: {models[0]}")
                    return models[0]
            return model
        
        # Si no se especifica modelo, verificar si el por defecto está disponible
        models = await self.get_available_models()
        if models:
            if self.default_model in models:
                return self.default_model
            else:
                # Usar el primer modelo disponible
                logger.info(f"Modelo '{self.default_model}' no disponible. Usando: {models[0]}")
                return models[0]
        
        # Si no hay modelos, usar el por defecto (fallará pero dará un error claro)
        logger.error(f"No hay modelos disponibles. Usando por defecto: {self.default_model}")
        return self.default_model
    
    async def get_available_models(self) -> list:
        """Obtiene la lista de modelos disponibles en Ollama"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.ollama_url}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    return [model['name'] for model in data.get('models', [])]
                return []
        except Exception as e:
            logger.error(f"Error obteniendo modelos: {e}")
            return []
    
    async def _get_user_context(self, db: Session, user: User, intention: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Obtiene contexto relevante del usuario para el chatbot"""
        context = {
            "user_name": user.nombre or user.correo,
            "user_role": user.rol,
            "recent_quotations": [],
            "client_info": None,
            "total_clients": 0
        }
        
        try:
            # Obtener últimas 5 cotizaciones del usuario
            quotations = QuotationService.get_quotations(
                db, skip=0, limit=5, current_user=user
            )
            context["recent_quotations"] = [
                {
                    "numero": q.numero_cotizacion,
                    "vehiculo": q.vehiculo,
                    "valor": q.valor_total,
                    "estado": q.estado,
                    "fecha": q.fecha_creacion.isoformat() if q.fecha_creacion else None
                }
                for q in quotations[:5]
            ]
        except Exception as e:
            logger.error(f"Error obteniendo cotizaciones para contexto: {e}")
        
        # Si el usuario quiere información de clientes, obtener datos de clientes
        if intention and intention.get("wants_client_info"):
            try:
                # Obtener conteo total de clientes de manera eficiente
                from ..models.client import Client
                total_clients = db.query(Client).count()
                context["total_clients"] = total_clients
                
                # Obtener algunos clientes recientes para contexto (solo si hay clientes)
                if total_clients > 0:
                    recent_clients = ClientService.get_clients(db, skip=0, limit=10)
                    context["recent_clients"] = [
                        {
                            "id": c.id_cliente,
                            "nombre": f"{c.nombre} {c.apellidos}".strip(),
                            "telefono": c.telefono,
                            "preferencias": c.preferencias
                        }
                        for c in recent_clients
                    ]
            except Exception as e:
                logger.error(f"Error obteniendo clientes para contexto: {e}")
        
        return context
    
    def _detect_intention(self, message: str) -> Dict[str, Any]:
        """Detecta la intención del usuario en el mensaje"""
        message_lower = message.lower()
        intention = {
            "type": "general",
            "wants_quotation": False,
            "wants_client_info": False,
            "wants_payment_info": False,
            "wants_create_client": False,
            "extracted_data": {}
        }
        
        # Detectar si quiere crear una cotización
        quotation_keywords = [
            "cotizar", "cotización", "precio", "costo", "quiero comprar",
            "necesito", "presupuesto", "valor", "cuanto cuesta", "crear cotización"
        ]
        if any(keyword in message_lower for keyword in quotation_keywords):
            intention["wants_quotation"] = True
            intention["type"] = "quotation_request"
        
        # Detectar si quiere crear/agregar un cliente
        create_client_keywords = [
            "agregar cliente", "crear cliente", "nuevo cliente", "registrar cliente",
            "como agrego", "como creo", "agregar un cliente", "crear un cliente"
        ]
        if any(keyword in message_lower for keyword in create_client_keywords):
            intention["wants_create_client"] = True
            intention["type"] = "create_client"
        
        # Detectar si quiere información de cliente
        client_keywords = ["cliente", "clientes", "historial cliente", "datos cliente", "listar clientes"]
        if any(keyword in message_lower for keyword in client_keywords) and not intention["wants_create_client"]:
            intention["wants_client_info"] = True
            intention["type"] = "client_info"
        
        # Detectar si quiere información de pagos
        payment_keywords = ["pago", "pagos", "cronograma", "cuota", "financiamiento"]
        if any(keyword in message_lower for keyword in payment_keywords):
            intention["wants_payment_info"] = True
            intention["type"] = "payment_info"
        
        return intention
    
    def _build_system_prompt(self, user_context: Dict[str, Any], intention: Dict[str, Any]) -> str:
        """Construye el prompt del sistema con contexto personalizado"""
        base_prompt = """Eres un asistente virtual inteligente para "Servicios Empresariales y Generales Trébol - Financiamiento Automotriz".

=== ESTRUCTURA REAL DEL SISTEMA ===

MÓDULOS DISPONIBLES (SOLO estos existen):
1. Dashboard - Vista general del sistema
2. Cotizaciones - Gestión de cotizaciones de vehículos
3. Clientes - Gestión de clientes
4. Inventario - Gestión de vehículos en inventario
5. Créditos - Gestión de solicitudes de crédito
6. Pagos - Gestión de pagos y cronogramas
7. Entregas - Gestión de entregas de vehículos
8. Alertas - Sistema de alertas y notificaciones

CAMPOS REALES DE CLIENTE (SOLO estos existen):
- nombre (requerido)
- apellidos (opcional)
- telefono (requerido)
- email (opcional)
- preferencias (opcional - texto libre)

CAMPOS REALES DE COTIZACIÓN (SOLO estos existen):
- numero_cotizacion (número único)
- vehiculo (descripción del vehículo)
- estado (puede ser: "frio", "tibio", "caliente")
- tipo_pago (puede ser: "contado" o "financiado")
- fecha_registro
- fecha_seguimiento

ESTADOS DE COTIZACIÓN (SOLO estos existen):
- "frio" - Cliente con bajo interés
- "tibio" - Cliente con interés moderado
- "caliente" - Cliente con alto interés

TIPOS DE PAGO (SOLO estos existen):
- "contado" - Pago de contado
- "financiado" - Pago financiado

=== REGLAS CRÍTICAS - DEBES SEGUIRLAS ESTRICTAMENTE ===

1. SOLO menciona los módulos listados arriba. NUNCA inventes módulos que no existen (como "Facturación", "Reportes", "Configuración", etc. a menos que estén en la lista).
2. SOLO menciona los campos listados arriba para cada entidad. NUNCA inventes campos como "DNI", "CURP", "dirección", "fecha de nacimiento", etc. que no existen en el sistema.
3. SOLO usa la información que se te proporciona en el contexto. NUNCA inventes, asumas o generes información que no esté explícitamente en el contexto proporcionado.
4. Si no tienes información sobre algo, di claramente: "No tengo esa información en el sistema" o "No tengo acceso a esos datos en este momento".
5. NUNCA inventes nombres de clientes, números de cotización, precios, vehículos, fechas, o cualquier otro dato.
6. Si el usuario pregunta sobre algo que no está en el contexto proporcionado o no existe en el sistema, admítelo honestamente y ofrece alternativas (como consultar directamente en el sistema o contactar al administrador).

Tu función es ayudar a los usuarios con:
- Información sobre cotizaciones (SOLO las que aparecen en el contexto)
- Consultas sobre clientes (SOLO los que aparecen en el contexto)
- Guía para crear nuevas cotizaciones o clientes (usando SOLO los campos reales listados arriba)
- Preguntas generales sobre cómo usar el sistema (mencionando SOLO los módulos reales)

INSTRUCCIONES IMPORTANTES:
1. Responde de manera profesional, clara y concisa en español.
2. Si el usuario quiere crear una cotización, guíalo para recopilar:
   - Tipo de vehículo o producto (campo "vehiculo")
   - Cliente (debe existir en el sistema)
   - Valor estimado (no es un campo del sistema, solo información para la cotización)
   - Tipo de pago: "contado" o "financiado"
3. Si el usuario pregunta cómo agregar un cliente, explica que debe:
   - Ir al módulo "Clientes" en el menú lateral
   - Hacer clic en "Crear Nuevo Cliente"
   - Completar los campos: nombre (requerido), apellidos (opcional), telefono (requerido), email (opcional), preferencias (opcional)
   - NO menciones campos que no existen como DNI, dirección, fecha de nacimiento, etc.
4. Si no sabes algo o no está en el contexto, di claramente: "No tengo esa información específica. Te recomiendo consultar directamente en el módulo correspondiente del sistema."
5. Cuando tengas suficiente información para una cotización, indica claramente: "Tengo toda la información necesaria. ¿Deseas que proceda a crear la cotización?"

"""
        
        # Agregar contexto del usuario
        if user_context:
            context_section = f"\n=== INFORMACIÓN DISPONIBLE EN EL SISTEMA ===\n"
            context_section += f"\nUSUARIO ACTUAL:\n"
            context_section += f"- Nombre: {user_context.get('user_name', 'N/A')}\n"
            context_section += f"- Rol: {user_context.get('user_role', 'N/A')}\n"
            
            # Información de cotizaciones
            recent_quotations = user_context.get('recent_quotations', [])
            if recent_quotations:
                context_section += f"\nCOTIZACIONES RECIENTES DEL USUARIO (últimas 3):\n"
                for q in recent_quotations[:3]:
                    context_section += f"- Cotización #{q.get('numero', 'N/A')}: {q.get('vehiculo', 'N/A')} - Valor: S/. {q.get('valor', 0):,.2f} - Estado: {q.get('estado', 'N/A')}\n"
            else:
                context_section += f"\nCOTIZACIONES: No hay cotizaciones recientes registradas para este usuario.\n"
            
            # Información de clientes
            total_clients = user_context.get('total_clients', 0)
            context_section += f"\nINFORMACIÓN DE CLIENTES:\n"
            context_section += f"- Total de clientes en el sistema: {total_clients}\n"
            
            recent_clients = user_context.get('recent_clients', [])
            if recent_clients:
                context_section += f"\nAlgunos clientes recientes (máximo 5):\n"
                for c in recent_clients[:5]:
                    nombre = c.get('nombre', 'N/A')
                    telefono = c.get('telefono', 'N/A')
                    context_section += f"- {nombre} - Teléfono: {telefono}\n"
            else:
                context_section += f"- No hay clientes recientes para mostrar.\n"
            
            context_section += f"\n=== FIN DE INFORMACIÓN DISPONIBLE ===\n"
            context_section += f"\nIMPORTANTE: Solo puedes usar la información listada arriba. Si el usuario pregunta sobre algo que NO está en esta lista, debes decir que no tienes esa información.\n"
            
            base_prompt += context_section
        
        # Agregar información sobre intención detectada
        if intention.get("wants_quotation"):
            base_prompt += "\n\nDETECCIÓN: El usuario parece querer crear una cotización. Guíalo paso a paso para recopilar: tipo de vehículo, cliente, valor estimado, y tipo de pago. NO inventes precios ni información.\n"
        
        if intention.get("wants_create_client"):
            base_prompt += "\n\nDETECCIÓN: El usuario quiere saber cómo agregar/crear un cliente. Explícale que debe:\n"
            base_prompt += "1. Ir al módulo 'Clientes' en el menú lateral\n"
            base_prompt += "2. Hacer clic en el botón 'Crear Nuevo Cliente'\n"
            base_prompt += "3. Completar el formulario con los siguientes campos (SOLO estos existen):\n"
            base_prompt += "   - Nombre (requerido)\n"
            base_prompt += "   - Apellidos (opcional)\n"
            base_prompt += "   - Teléfono (requerido)\n"
            base_prompt += "   - Correo electrónico (opcional)\n"
            base_prompt += "   - Preferencias (opcional - texto libre para notas sobre preferencias del cliente)\n"
            base_prompt += "IMPORTANTE: NO menciones campos que no existen como DNI, CURP, dirección, fecha de nacimiento, etc.\n"
        
        if intention.get("wants_client_info"):
            base_prompt += "\n\nDETECCIÓN: El usuario está preguntando sobre clientes. SOLO puedes mencionar los clientes que aparecen en la lista de 'INFORMACIÓN DE CLIENTES' arriba. Si pregunta sobre un cliente específico que no está en la lista, di que no tienes esa información.\n"
        
        # Instrucción final reforzada
        base_prompt += "\n\n=== RECORDATORIO FINAL ===\n"
        base_prompt += "1. SOLO menciona los módulos listados en 'ESTRUCTURA REAL DEL SISTEMA' arriba.\n"
        base_prompt += "2. SOLO menciona los campos listados en 'ESTRUCTURA REAL DEL SISTEMA' arriba para cada entidad.\n"
        base_prompt += "3. Si no tienes la información solicitada en el contexto proporcionado, di claramente que no la tienes.\n"
        base_prompt += "4. NUNCA inventes datos, nombres, números, precios, fechas, módulos, campos, o cualquier otra información.\n"
        base_prompt += "5. Si el usuario pregunta sobre algo que no existe en el sistema (módulo, campo, funcionalidad), di que no existe o que no tienes esa información.\n"
        
        return base_prompt
    
    async def chat(
        self, 
        message: str, 
        model: Optional[str] = None,
        context: Optional[list] = None,
        stream: bool = False,
        db: Optional[Session] = None,
        user: Optional[User] = None
    ) -> dict:
        """
        Envía un mensaje al chatbot y obtiene respuesta
        
        Args:
            message: Mensaje del usuario
            model: Modelo a usar (por defecto self.default_model)
            context: Historial de conversación anterior
            stream: Si True, retorna un generador para streaming
            db: Sesión de base de datos (opcional)
            user: Usuario autenticado (opcional)
        
        Returns:
            dict con la respuesta del modelo
        """
        # Obtener el modelo a usar (detecta automáticamente si es necesario)
        model = await self._get_or_detect_model(model)
        
        # Preparar el historial de conversación
        messages = context or []
        messages.append({
            "role": "user",
            "content": message
        })
        
        # Detectar intención del usuario
        intention = self._detect_intention(message)
        
        # Obtener contexto del usuario si está disponible
        user_context = {}
        if db and user:
            user_context = await self._get_user_context(db, user, intention)
        
        # Construir prompt del sistema con contexto
        system_prompt = self._build_system_prompt(user_context, intention)
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages
            ],
            "stream": stream,
            "options": {
                "temperature": 0.7,  # Creatividad (0-1)
                "top_p": 0.9,
                "top_k": 40
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                if stream:
                    # Para streaming, retornamos el generador
                    return await self._stream_response(client, payload)
                else:
                    # Respuesta completa
                    response = await client.post(
                        f"{self.ollama_url}/api/chat",
                        json=payload
                    )
                    if response.status_code != 200:
                        error_text = response.text[:200]
                        error_msg = f"Error {response.status_code} de Ollama: {error_text}"
                        logger.error(error_msg)
                        return {"error": error_msg}
                    
                    response.raise_for_status()
                    data = response.json()
                    response_message = data.get("message", {}).get("content", "")
                    
                    # Agregar metadata de intención detectada
                    result = {
                        "message": response_message,
                        "model": model,
                        "done": data.get("done", True),
                        "intention": intention
                    }
                    
                    # Si detectó que quiere cotización, agregar flag especial
                    if intention.get("wants_quotation"):
                        result["action_required"] = "create_quotation"
                        result["suggestion"] = "El usuario parece querer crear una cotización. Debes guiarlo para recopilar: vehículo, cliente, y valor estimado."
                    
                    return result
        except httpx.HTTPStatusError as e:
            error_msg = f"Error HTTP {e.response.status_code} de Ollama: {e.response.text[:200]}"
            logger.error(f"Error en chat (HTTP): {error_msg}")
            return {"error": error_msg}
        except httpx.ConnectError as e:
            error_msg = f"No se puede conectar a Ollama en {self.ollama_url}. Verifica que Ollama esté corriendo (ollama serve)."
            logger.error(f"Error en chat (conexión): {error_msg}")
            return {"error": error_msg}
        except httpx.TimeoutException:
            logger.error("Timeout esperando respuesta de Ollama")
            return {"error": "El modelo tardó demasiado en responder. Intenta con un mensaje más corto."}
        except Exception as e:
            logger.error(f"Error en chat: {e}")
            return {"error": f"Error al comunicarse con el modelo: {str(e)}"}
    
    async def _stream_response(
        self, 
        client: httpx.AsyncClient, 
        payload: dict
    ) -> AsyncGenerator[str, None]:
        """Generador para respuestas en streaming"""
        try:
            async with client.stream(
                "POST",
                f"{self.ollama_url}/api/chat",
                json=payload
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                yield data["message"]["content"]
                            if data.get("done", False):
                                break
                        except JSONDecodeError:
                            continue
        except Exception as e:
            logger.error(f"Error en streaming: {e}")
            yield f"Error: {str(e)}"
    
    async def generate_response_stream(
        self,
        message: str,
        model: Optional[str] = None,
        context: Optional[list] = None,
        db: Optional[Session] = None,
        user: Optional[User] = None
    ) -> AsyncGenerator[str, None]:
        """Generador para streaming de respuestas con contexto"""
        # Obtener el modelo a usar (detecta automáticamente si es necesario)
        model = await self._get_or_detect_model(model)
        messages = context or []
        messages.append({"role": "user", "content": message})
        
        # Detectar intención y obtener contexto
        intention = self._detect_intention(message)
        user_context = {}
        if db and user:
            user_context = await self._get_user_context(db, user, intention)
        
        system_prompt = self._build_system_prompt(user_context, intention)
        
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                *messages
            ],
            "stream": True,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9
            }
        }
        
        try:
            # Log para depuración
            logger.info(f"Enviando request a Ollama: {self.ollama_url}/api/chat con modelo: {model}")
            logger.debug(f"Payload: {json.dumps(payload, indent=2)}")
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                async with client.stream(
                    "POST",
                    f"{self.ollama_url}/api/chat",
                    json=payload
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        error_msg = f"Error {response.status_code} de Ollama: {error_text.decode('utf-8', errors='ignore')[:200]}"
                        logger.error(f"Error de Ollama: {error_msg}")
                        logger.error(f"URL intentada: {self.ollama_url}/api/chat")
                        logger.error(f"Modelo usado: {model}")
                        yield f"Error: {error_msg}"
                        return
                    
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    yield data["message"]["content"]
                                if data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
        except httpx.HTTPStatusError as e:
            error_msg = f"Error HTTP {e.response.status_code}: {e.response.text[:200]}"
            logger.error(f"Error en streaming (HTTP): {error_msg}")
            yield f"Error: {error_msg}"
        except httpx.ConnectError as e:
            error_msg = f"No se puede conectar a Ollama en {self.ollama_url}. Verifica que Ollama esté corriendo."
            logger.error(f"Error en streaming (conexión): {error_msg}")
            yield f"Error: {error_msg}"
        except Exception as e:
            error_msg = f"Error al comunicarse con Ollama: {str(e)}"
            logger.error(f"Error en streaming: {error_msg}")
            yield f"Error: {error_msg}"


# Instancia global del servicio
chatbot_service = ChatbotService()
