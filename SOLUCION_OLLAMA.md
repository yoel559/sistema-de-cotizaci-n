# 🔧 Solución: "Ollama no está disponible"

## 🔍 Diagnóstico del Problema

Si ves el mensaje **"Ollama no está disponible"** o el estado **"Desconectado"**, significa que el sistema no puede conectarse con Ollama. Aquí están las soluciones:

## ✅ Solución 1: Verificar que Ollama esté instalado

### Windows:
```bash
# Abre PowerShell o CMD y ejecuta:
ollama --version
```

Si no está instalado:
1. Ve a https://ollama.ai
2. Descarga e instala Ollama
3. Reinicia tu terminal

### Linux:
```bash
# Verificar instalación
ollama --version

# Si no está instalado:
curl -fsSL https://ollama.ai/install.sh | sh
```

### Mac:
```bash
# Verificar instalación
ollama --version

# Si no está instalado:
brew install ollama
# o descarga desde https://ollama.ai
```

## ✅ Solución 2: Verificar que Ollama esté corriendo

### Windows:
```bash
# Iniciar Ollama
ollama serve
```

Deja esta ventana abierta. Ollama debe estar corriendo en `http://localhost:11434`

### Linux/Mac:
```bash
# Iniciar Ollama
ollama serve
```

O si está como servicio:
```bash
# Verificar estado
systemctl status ollama  # Linux
brew services list       # Mac
```

## ✅ Solución 3: Descargar un modelo

Una vez que Ollama esté corriendo, necesitas descargar un modelo:

```bash
# Opción 1: Llama 3 (recomendado, ~4.7GB)
ollama pull llama3

# Opción 2: Llama 3.2 (más pequeño, ~2GB)
ollama pull llama3.2

# Opción 3: Mistral (alternativa, ~4.1GB)
ollama pull mistral
```

**Nota:** La primera descarga puede tardar varios minutos dependiendo de tu conexión.

## ✅ Solución 4: Verificar la conexión

Abre tu navegador y ve a:
```
http://localhost:11434/api/tags
```

Deberías ver una respuesta JSON con los modelos disponibles. Si ves un error, Ollama no está corriendo correctamente.

## ✅ Solución 5: Verificar el puerto

Por defecto, Ollama usa el puerto **11434**. Si ese puerto está ocupado:

1. **Cambiar puerto de Ollama:**
   ```bash
   # Windows: Edita la variable de entorno OLLAMA_HOST
   set OLLAMA_HOST=0.0.0.0:11435
   ollama serve
   
   # Linux/Mac:
   export OLLAMA_HOST=0.0.0.0:11435
   ollama serve
   ```

2. **Actualizar configuración del backend:**
   Edita `backend/.env` o `backend/app/core/config.py`:
   ```python
   OLLAMA_URL = "http://localhost:11435"
   ```

## ✅ Solución 6: Reiniciar todo

1. **Cerrar Ollama** (si está corriendo)
2. **Cerrar el backend** (si está corriendo)
3. **Iniciar Ollama:**
   ```bash
   ollama serve
   ```
4. **Esperar 2-3 segundos**
5. **Iniciar el backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
6. **Abrir el frontend** y hacer clic en "Reintentar" en el chatbot

## ✅ Solución 7: Verificar firewall/antivirus

A veces el firewall o antivirus bloquea la conexión:

- **Windows:** Agregar excepción para Ollama en Windows Defender
- **Antivirus:** Verificar que Ollama no esté bloqueado

## ✅ Solución 8: Ver logs del backend

Revisa los logs del backend para ver errores específicos:

```bash
# En la consola del backend, busca errores como:
# "Error conectando con Ollama: ..."
```

## 🧪 Prueba Rápida

Ejecuta esto en tu terminal para verificar todo:

```bash
# 1. Verificar Ollama instalado
ollama --version

# 2. Verificar que Ollama esté corriendo
curl http://localhost:11434/api/tags

# 3. Verificar modelos disponibles
ollama list

# 4. Si no hay modelos, descargar uno
ollama pull llama3
```

## 📝 Checklist de Verificación

- [ ] Ollama está instalado (`ollama --version` funciona)
- [ ] Ollama está corriendo (`ollama serve` está activo)
- [ ] Hay al menos un modelo descargado (`ollama list` muestra modelos)
- [ ] El puerto 11434 está accesible (`http://localhost:11434/api/tags` responde)
- [ ] El backend está corriendo
- [ ] El frontend puede conectarse al backend

## 🆘 Si nada funciona

1. **Reinstalar Ollama:**
   - Desinstala Ollama completamente
   - Reinicia tu computadora
   - Instala Ollama nuevamente
   - Descarga un modelo

2. **Verificar logs detallados:**
   - Abre las herramientas de desarrollador del navegador (F12)
   - Ve a la pestaña "Console"
   - Busca errores relacionados con Ollama o el chatbot

3. **Contactar soporte:**
   - Proporciona los logs del backend
   - Proporciona los logs de la consola del navegador
   - Indica tu sistema operativo y versión de Ollama

## 💡 Consejos

- **Mantén Ollama corriendo:** Ollama debe estar activo mientras uses el chatbot
- **Primera vez:** La primera descarga de un modelo puede tardar mucho
- **Espacio en disco:** Los modelos ocupan varios GB, asegúrate de tener espacio
- **Conexión a internet:** Necesitas internet solo para descargar modelos, no para usarlos
















