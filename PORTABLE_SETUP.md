# 📦 Guía para Sistema Portable en USB

Esta guía te ayudará a crear una versión completamente portable del sistema que funcione desde un USB sin necesidad de instalar dependencias o modelos cada vez.

## 🎯 Objetivo

Crear un sistema que:
- ✅ Funcione desde un USB sin instalaciones adicionales
- ✅ Incluya todas las dependencias de Python
- ✅ Incluya los modelos de IA (Ollama)
- ✅ Use SQLite (base de datos portable)
- ✅ Solo requiera Python y Ollama instalados en el sistema destino

## 📋 Requisitos Previos

### En el sistema de desarrollo:
1. Python 3.8+ instalado
2. Node.js y npm instalados
3. Ollama instalado y funcionando
4. Modelo descargado (ej: `ollama pull llama3`)

### En el sistema destino (donde usarás el USB):
1. Python 3.8+ instalado
2. Ollama instalado (opcional si usas modelos portables)

## 🚀 Pasos para Crear el Sistema Portable

### Paso 1: Preparar el Build del Frontend

```bash
cd frontend
npm install
npm run build
```

Esto creará la carpeta `frontend/build` con todos los archivos estáticos.

### Paso 2: Ejecutar el Script de Preparación

```bash
python scripts/prepare_portable.py
```

Este script:
- ✅ Crea la estructura de directorios
- ✅ Copia todos los archivos del backend
- ✅ Copia el build del frontend
- ✅ Crea un entorno virtual de Python con todas las dependencias
- ✅ Crea scripts de inicio para Windows y Linux
- ✅ Prepara la estructura para modelos de Ollama

### Paso 3: Descargar y Copiar Modelos de Ollama

#### Opción A: Usar el script automático

```bash
python scripts/download_model.py
```

Este script:
- Detecta modelos instalados en Ollama
- Te permite seleccionar qué modelo copiar
- Copia el modelo a la carpeta portable

#### Opción B: Copiar manualmente

1. **Encuentra la ubicación de los modelos:**
   - Windows: `%USERPROFILE%\.ollama\models\`
   - Linux/Mac: `~/.ollama/models/`

2. **Copia el modelo:**
   - Copia la carpeta del modelo (ej: `llama3`) a `portable_build/ollama_models/`

3. **Ejemplo:**
   ```bash
   # Windows
   xcopy "%USERPROFILE%\.ollama\models\llama3" "portable_build\ollama_models\llama3\" /E /I
   
   # Linux/Mac
   cp -r ~/.ollama/models/llama3 portable_build/ollama_models/
   ```

### Paso 4: Configurar Ollama Portable (Opcional)

Si quieres que Ollama use los modelos portables:

```bash
python scripts/portable_ollama_setup.py
```

Esto crea scripts para iniciar Ollama con los modelos portables.

### Paso 5: Copiar a USB

1. Copia toda la carpeta `portable_build` a tu USB
2. Asegúrate de que el USB tenga suficiente espacio (al menos 5-10 GB)

## 💻 Usar el Sistema desde USB

### En Windows:

1. Conecta el USB
2. Navega a la carpeta del sistema en el USB
3. Doble clic en `start.bat`
4. Se abrirán dos ventanas:
   - Backend Server (puerto 8000)
   - Frontend Server (puerto 3000)

### En Linux/Mac:

1. Conecta el USB
2. Navega a la carpeta del sistema
3. Ejecuta: `./start.sh`
4. Los servidores se iniciarán en background

### Acceder al Sistema:

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Documentación:** http://localhost:8000/docs

## 📁 Estructura del USB

```
USB/
└── portable_build/
    ├── backend/              # Código del backend
    ├── frontend/             # Build del frontend
    ├── data/                 # Base de datos SQLite (se crea automáticamente)
    ├── ollama_models/        # Modelos de IA
    │   └── llama3/          # Modelo copiado
    ├── python_env/           # Entorno virtual de Python
    ├── scripts/              # Scripts de utilidad
    ├── start.bat            # Inicio en Windows
    ├── start.sh             # Inicio en Linux/Mac
    └── README.txt           # Instrucciones
```

## 🔧 Solución de Problemas

### Error: "Entorno virtual no encontrado"
- Ejecuta nuevamente `prepare_portable.py`
- Asegúrate de tener Python instalado

### Error: "Ollama no encontrado"
- Instala Ollama desde https://ollama.ai
- O usa los modelos portables con `start_ollama.bat/sh`

### Error: "Modelo no encontrado"
- Verifica que el modelo esté en `ollama_models/`
- Usa `download_model.py` para copiar modelos

### El frontend no carga
- Verifica que `frontend/build` exista
- Ejecuta `npm run build` en el sistema de desarrollo

### Puerto ya en uso
- Cambia los puertos en `start.bat` o `start.sh`
- O cierra otros programas que usen esos puertos

## 📝 Notas Importantes

1. **Primera vez:** La primera ejecución puede ser lenta mientras se inicializa todo
2. **Base de datos:** Se crea automáticamente en `data/trading_system.db`
3. **Modelos:** Los modelos pueden ser grandes (2-5 GB), asegúrate de tener espacio
4. **Python:** Debe estar instalado en el sistema destino
5. **Ollama:** Puede requerir instalación en el sistema destino (o usar modelos portables)

## 🎁 Ventajas del Sistema Portable

- ✅ No requiere instalación de dependencias en cada PC
- ✅ Todos los datos se guardan en el USB
- ✅ Modelos de IA incluidos
- ✅ Funciona en cualquier PC con Python
- ✅ Fácil de actualizar (solo copiar nueva versión)

## 🔄 Actualizar el Sistema

1. Ejecuta `prepare_portable.py` nuevamente
2. Copia la nueva carpeta `portable_build` al USB
3. (Opcional) Mantén la carpeta `data/` para conservar la base de datos

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en las ventanas de consola
2. Verifica que Python y Ollama estén instalados
3. Asegúrate de tener permisos de escritura en el USB
















