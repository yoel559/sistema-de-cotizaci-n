# 🤖 Configuración del Chatbot con Ollama

Este sistema incluye un chatbot inteligente basado en modelos de lenguaje de código abierto ejecutados localmente a través de Ollama.

## 📋 Requisitos Previos

1. **Instalar Ollama**: 
   - Descarga desde: https://ollama.ai
   - Instala según tu sistema operativo

2. **Descargar un modelo**:
   ```bash
   # Opción 1: Phi-3 Mini (recomendado, ~2.3GB) - Modelo por defecto
   ollama pull phi3:mini
   
   # Opción 2: Llama 3 (~4.7GB)
   ollama pull llama3
   
   # Opción 3: Mistral (más ligero, ~4.1GB)
   ollama pull mistral
   
   # Opción 4: Llama 3.2 (más pequeño, ~2GB)
   ollama pull llama3.2
   ```

3. **Verificar que Ollama está corriendo**:
   ```bash
   # Debería responder en http://localhost:11434
   curl http://localhost:11434/api/tags
   ```

## ⚙️ Configuración del Backend

1. **Instalar dependencias**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Configurar variables de entorno** (opcional):
   En `backend/app/core/config.py` o `.env`, puedes agregar:
   ```python
   OLLAMA_URL = "http://localhost:11434"  # Por defecto
   OLLAMA_MODEL = "llama3"  # Modelo por defecto
   ```

3. **Iniciar el backend**:
   ```bash
   uvicorn app.main:app --reload
   ```

## 🎨 Uso en el Frontend

El chatbot ya está integrado. Verás un botón flotante en la esquina inferior derecha cuando estés autenticado.

### Características:
- ✅ Chat en tiempo real con streaming
- ✅ Selección de modelo (si tienes varios instalados)
- ✅ Historial de conversación
- ✅ Interfaz moderna y responsive
- ✅ Contexto del negocio (Trebol Servicios Empresariales)

## 🔌 Endpoints de la API

### Verificar estado:
```
GET /api/v1/chatbot/status
```

### Obtener modelos disponibles:
```
GET /api/v1/chatbot/models
```

### Enviar mensaje (REST):
```
POST /api/v1/chatbot/chat
Body: {
  "message": "¿Cuántas cotizaciones hay?",
  "model": "llama3",  // opcional
  "context": []  // opcional, historial previo
}
```

### Chat con streaming (WebSocket):
```
WS /api/v1/chatbot/chat/stream
```

## 🛠️ Solución de Problemas

### Ollama no responde:
1. Verifica que Ollama esté corriendo: `ollama list`
2. Verifica el puerto: `curl http://localhost:11434/api/tags`
3. Revisa los logs del backend

### Modelo no encontrado:
1. Lista modelos instalados: `ollama list`
2. Descarga el modelo: `ollama pull llama3`
3. Verifica en el frontend que el modelo esté disponible

### Respuestas lentas:
- Usa un modelo más pequeño (llama3.2 en lugar de llama3)
- Ajusta `temperature` en `chatbot_service.py` (menor = más rápido)
- Reduce el contexto enviado

## 📝 Personalización

### Cambiar el prompt del sistema:
Edita `backend/app/services/chatbot_service.py`, función `chat()`, variable `system_prompt`.

### Ajustar parámetros del modelo:
En `chatbot_service.py`, sección `options`:
```python
"options": {
    "temperature": 0.7,  # Creatividad (0-1)
    "top_p": 0.9,       # Nucleus sampling
    "top_k": 40         # Top-k sampling
}
```

## 🚀 Mejoras Futuras

- [ ] Integración con base de datos para consultas reales
- [ ] Memoria persistente de conversaciones
- [ ] Múltiples asistentes especializados
- [ ] Exportación de conversaciones
- [ ] Análisis de sentimiento
















