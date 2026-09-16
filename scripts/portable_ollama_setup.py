"""
Script para configurar Ollama para usar modelos portables
Crea un servidor Ollama que lee modelos desde la carpeta portable
"""
import os
import subprocess
import sys
from pathlib import Path
import json

def create_ollama_config(portable_dir):
    """Crea configuración de Ollama para usar modelos portables"""
    models_dir = portable_dir / "ollama_models"
    
    if not models_dir.exists():
        print("⚠ Directorio de modelos no encontrado")
        return False
    
    # Crear archivo de configuración
    config_file = portable_dir / "ollama_config.json"
    
    config = {
        "models_path": str(models_dir),
        "port": 11434,
        "host": "localhost"
    }
    
    with open(config_file, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2)
    
    print(f"✅ Configuración creada en: {config_file}")
    return True

def create_ollama_wrapper_script(portable_dir):
    """Crea un script wrapper para iniciar Ollama con modelos portables"""
    models_dir = portable_dir / "ollama_models"
    
    # Script para Windows
    bat_script = portable_dir / "start_ollama.bat"
    with open(bat_script, "w", encoding="utf-8") as f:
        f.write(f"""@echo off
echo Iniciando Ollama con modelos portables...
echo.

REM Verificar que Ollama esté instalado
where ollama >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Ollama no encontrado
    echo Por favor instala Ollama desde https://ollama.ai
    pause
    exit /b 1
)

REM Crear enlace simbólico o copiar modelos si es necesario
if not exist "%USERPROFILE%\\.ollama\\models" (
    mkdir "%USERPROFILE%\\.ollama\\models"
)

REM Iniciar Ollama
echo Iniciando servidor Ollama...
start "Ollama Server" cmd /k "ollama serve"

REM Esperar un momento
timeout /t 2 /nobreak >nul

REM Cargar modelos desde la carpeta portable
echo Cargando modelos portables...
for /d %%M in ("{models_dir}\\*") do (
    echo   - %%M
    ollama pull %%M
)

echo.
echo Ollama iniciado correctamente
echo Modelos disponibles en: {models_dir}
pause
""")
    print(f"✅ Script de inicio creado: {bat_script.name}")
    
    # Script para Linux/Mac
    sh_script = portable_dir / "start_ollama.sh"
    with open(sh_script, "w", encoding="utf-8") as f:
        f.write(f"""#!/bin/bash
echo "Iniciando Ollama con modelos portables..."
echo ""

# Verificar que Ollama esté instalado
if ! command -v ollama &> /dev/null; then
    echo "[ERROR] Ollama no encontrado"
    echo "Por favor instala Ollama desde https://ollama.ai"
    exit 1
fi

# Crear directorio si no existe
mkdir -p "$HOME/.ollama/models"

# Iniciar Ollama en background
echo "Iniciando servidor Ollama..."
ollama serve &
OLLAMA_PID=$!

# Esperar un momento
sleep 2

# Cargar modelos desde la carpeta portable
echo "Cargando modelos portables..."
for model_dir in "{models_dir}"/*; do
    if [ -d "$model_dir" ]; then
        model_name=$(basename "$model_dir")
        echo "  - $model_name"
        ollama pull "$model_name" || true
    fi
done

echo ""
echo "Ollama iniciado correctamente"
echo "Modelos disponibles en: {models_dir}"
echo "Presiona Ctrl+C para detener"
wait $OLLAMA_PID
""")
    os.chmod(sh_script, 0o755)
    print(f"✅ Script de inicio creado: {sh_script.name}")

def main():
    print("=" * 60)
    print("CONFIGURAR OLLAMA PARA MODELOS PORTABLES")
    print("=" * 60)
    print()
    
    portable_dir = Path(__file__).resolve().parent.parent / "portable_build"
    
    if not portable_dir.exists():
        print("⚠ Directorio portable_build no encontrado")
        print("  Ejecuta primero: python scripts/prepare_portable.py")
        return
    
    models_dir = portable_dir / "ollama_models"
    
    if not models_dir.exists():
        print("⚠ Directorio de modelos no encontrado")
        print("  Copia los modelos a: ollama_models/")
        return
    
    # Listar modelos disponibles
    models = [d.name for d in models_dir.iterdir() if d.is_dir()]
    
    if not models:
        print("⚠ No se encontraron modelos en ollama_models/")
        print("  Usa download_model.py para copiar modelos")
        return
    
    print(f"📦 Modelos encontrados: {', '.join(models)}\n")
    
    # Crear configuración
    create_ollama_config(portable_dir)
    create_ollama_wrapper_script(portable_dir)
    
    print("\n" + "=" * 60)
    print("✅ CONFIGURACIÓN COMPLETA")
    print("=" * 60)
    print("\n📋 Para usar modelos portables:")
    print("  1. Ejecuta start_ollama.bat (Windows) o start_ollama.sh (Linux/Mac)")
    print("  2. Esto iniciará Ollama y cargará los modelos portables")
    print("  3. Luego ejecuta start.bat/start.sh para iniciar el sistema")
    print()

if __name__ == "__main__":
    main()
















