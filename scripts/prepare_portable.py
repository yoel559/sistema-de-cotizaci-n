"""
Script para preparar el proyecto como portable en USB
Copia dependencias, modelos y configura todo para funcionar sin instalaciones
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path
import json

BASE_DIR = Path(__file__).resolve().parent.parent
PORTABLE_DIR = BASE_DIR / "portable_build"

def create_portable_structure():
    """Crea la estructura de directorios para el build portable"""
    print("📁 Creando estructura de directorios...")
    
    dirs = [
        PORTABLE_DIR / "backend",
        PORTABLE_DIR / "frontend",
        PORTABLE_DIR / "data",
        PORTABLE_DIR / "ollama_models",
        PORTABLE_DIR / "python_env",
        PORTABLE_DIR / "scripts",
    ]
    
    for dir_path in dirs:
        dir_path.mkdir(parents=True, exist_ok=True)
        print(f"  ✓ {dir_path.name}")
    
    return PORTABLE_DIR

def copy_backend_files():
    """Copia los archivos del backend"""
    print("\n📦 Copiando archivos del backend...")
    
    backend_src = BASE_DIR / "backend"
    backend_dst = PORTABLE_DIR / "backend"
    
    # Archivos y carpetas a copiar
    items_to_copy = [
        "app",
        "alembic",
        "alembic.ini",
        "requirements.txt",
    ]
    
    for item in items_to_copy:
        src = backend_src / item
        if src.exists():
            if src.is_dir():
                shutil.copytree(src, backend_dst / item, dirs_exist_ok=True)
            else:
                shutil.copy2(src, backend_dst / item)
            print(f"  ✓ {item}")
    
    # Crear archivo PORTABLE_MODE.txt
    (backend_dst / "PORTABLE_MODE.txt").touch()
    print("  ✓ PORTABLE_MODE.txt creado")

def copy_frontend_build():
    """Copia el build del frontend"""
    print("\n🌐 Copiando build del frontend...")
    
    frontend_build = BASE_DIR / "frontend" / "build"
    frontend_dst = PORTABLE_DIR / "frontend"
    
    if frontend_build.exists():
        shutil.copytree(frontend_build, frontend_dst / "build", dirs_exist_ok=True)
        print("  ✓ Build del frontend copiado")
    else:
        print("  ⚠ Build del frontend no encontrado. Ejecuta 'npm run build' primero.")

def create_python_venv():
    """Crea un entorno virtual portable de Python"""
    print("\n🐍 Creando entorno virtual de Python...")
    
    venv_path = PORTABLE_DIR / "python_env"
    
    if venv_path.exists():
        print("  ⚠ Entorno virtual ya existe, omitiendo...")
        return
    
    try:
        subprocess.run([
            sys.executable, "-m", "venv", str(venv_path)
        ], check=True)
        print("  ✓ Entorno virtual creado")
        
        # Instalar dependencias
        print("  📥 Instalando dependencias...")
        pip_path = venv_path / ("Scripts" if os.name == "nt" else "bin") / "pip"
        
        subprocess.run([
            str(pip_path), "install", "-r", str(BASE_DIR / "backend" / "requirements.txt")
        ], check=True)
        print("  ✓ Dependencias instaladas")
        
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Error: {e}")
        print("  ⚠ Debes instalar las dependencias manualmente después")

def download_ollama_model():
    """Descarga el modelo de Ollama y lo guarda localmente"""
    print("\n🤖 Preparando modelo de Ollama...")
    
    models_dir = PORTABLE_DIR / "ollama_models"
    
    print("  ℹ Para usar modelos portables, necesitas:")
    print("    1. Instalar Ollama: https://ollama.ai")
    print("    2. Ejecutar: ollama pull llama3")
    print("    3. Copiar el modelo desde ~/.ollama/models a ollama_models/")
    print("    4. O usar el script download_model.py después")
    
    # Crear archivo de instrucciones
    readme = models_dir / "README.txt"
    with open(readme, "w", encoding="utf-8") as f:
        f.write("""INSTRUCCIONES PARA MODELOS PORTABLES:

1. Instala Ollama desde https://ollama.ai
2. Descarga el modelo:
   ollama pull llama3
   
3. Copia el modelo:
   - Windows: Copia desde %USERPROFILE%\\.ollama\\models\\llama3
   - Linux/Mac: Copia desde ~/.ollama/models/llama3
   
4. Pega la carpeta 'llama3' en este directorio (ollama_models/)

5. Alternativamente, usa el script download_model.py incluido
""")
    print(f"  ✓ Instrucciones guardadas en {readme}")

def create_startup_scripts():
    """Crea scripts de inicio para Windows y Linux"""
    print("\n📝 Creando scripts de inicio...")
    
    # Script para Windows
    windows_script = PORTABLE_DIR / "start.bat"
    with open(windows_script, "w", encoding="utf-8") as f:
        f.write("""@echo off
echo ========================================
echo  Trebol Servicios Empresariales
echo  Sistema Portable
echo ========================================
echo.

cd /d "%~dp0"

REM Verificar Python
if not exist "python_env\\Scripts\\python.exe" (
    echo [ERROR] Entorno virtual de Python no encontrado
    echo Por favor ejecuta prepare_portable.py primero
    pause
    exit /b 1
)

REM Activar entorno virtual
call python_env\\Scripts\\activate.bat

REM Verificar Ollama
echo Verificando Ollama...
where ollama >nul 2>&1
if errorlevel 1 (
    echo [ADVERTENCIA] Ollama no encontrado en PATH
    echo El chatbot no funcionara sin Ollama
    echo.
) else (
    echo Ollama encontrado
    echo.
)

REM Iniciar servidor backend
echo Iniciando servidor backend...
start "Backend Server" cmd /k "cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"

REM Esperar un momento
timeout /t 3 /nobreak >nul

REM Iniciar servidor frontend (si hay build)
if exist "frontend\\build" (
    echo Iniciando servidor frontend...
    start "Frontend Server" cmd /k "cd frontend\\build && python -m http.server 3000"
) else (
    echo [ADVERTENCIA] Build del frontend no encontrado
    echo El frontend no estara disponible
)

echo.
echo ========================================
echo  Servidores iniciados
echo  Backend: http://localhost:8000
echo  Frontend: http://localhost:3000
echo ========================================
echo.
echo Presiona cualquier tecla para cerrar esta ventana...
pause >nul
""")
    print(f"  ✓ {windows_script.name}")
    
    # Script para Linux/Mac
    linux_script = PORTABLE_DIR / "start.sh"
    with open(linux_script, "w", encoding="utf-8") as f:
        f.write("""#!/bin/bash
echo "========================================"
echo " Trebol Servicios Empresariales"
echo " Sistema Portable"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# Verificar Python
if [ ! -f "python_env/bin/python" ]; then
    echo "[ERROR] Entorno virtual de Python no encontrado"
    echo "Por favor ejecuta prepare_portable.py primero"
    exit 1
fi

# Activar entorno virtual
source python_env/bin/activate

# Verificar Ollama
echo "Verificando Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "[ADVERTENCIA] Ollama no encontrado en PATH"
    echo "El chatbot no funcionara sin Ollama"
    echo ""
else
    echo "Ollama encontrado"
    echo ""
fi

# Iniciar servidor backend
echo "Iniciando servidor backend..."
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Esperar un momento
sleep 3

# Iniciar servidor frontend (si hay build)
if [ -d "frontend/build" ]; then
    echo "Iniciando servidor frontend..."
    cd frontend/build
    python3 -m http.server 3000 &
    FRONTEND_PID=$!
    cd ../..
else
    echo "[ADVERTENCIA] Build del frontend no encontrado"
    echo "El frontend no estara disponible"
fi

echo ""
echo "========================================"
echo " Servidores iniciados"
echo " Backend: http://localhost:8000"
echo " Frontend: http://localhost:3000"
echo "========================================"
echo ""
echo "Presiona Ctrl+C para detener los servidores"
wait
""")
    os.chmod(linux_script, 0o755)
    print(f"  ✓ {linux_script.name}")

def create_readme():
    """Crea README con instrucciones"""
    print("\n📖 Creando README...")
    
    readme = PORTABLE_DIR / "README.txt"
    with open(readme, "w", encoding="utf-8") as f:
        f.write("""========================================
TREBOL SERVICIOS EMPRESARIALES
Sistema Portable para USB
========================================

INSTRUCCIONES DE USO:

1. PRIMERA VEZ (Preparación):
   - Ejecuta: python scripts/prepare_portable.py
   - Esto creará todas las dependencias necesarias

2. INSTALAR OLLAMA (Requerido para el chatbot):
   - Descarga desde: https://ollama.ai
   - Instala Ollama en el sistema
   - Ejecuta: ollama pull llama3
   - Copia el modelo a: ollama_models/llama3
     (Ver ollama_models/README.txt para más detalles)

3. INICIAR EL SISTEMA:
   - Windows: Doble clic en start.bat
   - Linux/Mac: Ejecuta ./start.sh
   
4. ACCEDER:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Documentación: http://localhost:8000/docs

ESTRUCTURA DEL USB:
- backend/          : Código del backend
- frontend/          : Build del frontend
- data/              : Base de datos SQLite
- ollama_models/     : Modelos de IA (copiar aquí)
- python_env/        : Entorno virtual de Python
- scripts/           : Scripts de utilidad
- start.bat / start.sh : Scripts de inicio

NOTAS:
- El sistema usa SQLite (portable, no requiere instalación)
- Python debe estar instalado en el sistema
- Ollama debe estar instalado para el chatbot
- Todos los datos se guardan en la carpeta data/

SOPORTE:
Para problemas, revisa los logs en las ventanas de consola
""")
    print(f"  ✓ {readme.name}")

def main():
    print("=" * 50)
    print("PREPARANDO SISTEMA PORTABLE PARA USB")
    print("=" * 50)
    print()
    
    # Crear estructura
    create_portable_structure()
    
    # Copiar archivos
    copy_backend_files()
    copy_frontend_build()
    
    # Crear entorno virtual
    create_python_venv()
    
    # Preparar modelos
    download_ollama_model()
    
    # Crear scripts
    create_startup_scripts()
    create_readme()
    
    print("\n" + "=" * 50)
    print("✅ PREPARACIÓN COMPLETA")
    print("=" * 50)
    print(f"\n📦 Build portable creado en: {PORTABLE_DIR}")
    print("\n📋 Próximos pasos:")
    print("  1. Copia la carpeta 'portable_build' a tu USB")
    print("  2. Instala Ollama y descarga el modelo")
    print("  3. Copia el modelo a ollama_models/")
    print("  4. Ejecuta start.bat (Windows) o start.sh (Linux/Mac)")
    print()

if __name__ == "__main__":
    main()
















