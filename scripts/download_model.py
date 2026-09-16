"""
Script para descargar y copiar modelos de Ollama a la carpeta portable
"""
import os
import shutil
import subprocess
import sys
from pathlib import Path

def find_ollama_models_dir():
    """Encuentra el directorio de modelos de Ollama"""
    if os.name == "nt":  # Windows
        ollama_dir = Path.home() / ".ollama" / "models"
    else:  # Linux/Mac
        ollama_dir = Path.home() / ".ollama" / "models"
    
    if not ollama_dir.exists():
        return None
    return ollama_dir

def list_available_models(ollama_dir):
    """Lista los modelos disponibles en Ollama"""
    if not ollama_dir or not ollama_dir.exists():
        return []
    
    models = []
    for item in ollama_dir.iterdir():
        if item.is_dir():
            # Buscar archivos .bin o directorios de modelo
            if any(item.glob("*.bin")) or any(item.glob("*.gguf")):
                models.append(item.name)
    
    return models

def copy_model_to_portable(model_name, ollama_dir, portable_dir):
    """Copia un modelo de Ollama a la carpeta portable"""
    source = ollama_dir / model_name
    destination = portable_dir / "ollama_models" / model_name
    
    if not source.exists():
        print(f"❌ Modelo '{model_name}' no encontrado en {source}")
        return False
    
    print(f"📦 Copiando modelo '{model_name}'...")
    print(f"   Desde: {source}")
    print(f"   Hacia: {destination}")
    
    try:
        if destination.exists():
            response = input(f"   ⚠ El modelo ya existe. ¿Sobrescribir? (s/n): ")
            if response.lower() != 's':
                print("   ⏭ Omitido")
                return False
            shutil.rmtree(destination)
        
        shutil.copytree(source, destination)
        print(f"   ✅ Modelo copiado exitosamente")
        return True
    except Exception as e:
        print(f"   ❌ Error copiando modelo: {e}")
        return False

def download_model_with_ollama(model_name):
    """Descarga un modelo usando Ollama CLI"""
    print(f"📥 Descargando modelo '{model_name}' con Ollama...")
    
    try:
        result = subprocess.run(
            ["ollama", "pull", model_name],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ Modelo '{model_name}' descargado exitosamente")
            return True
        else:
            print(f"❌ Error descargando modelo: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ Ollama no encontrado. Por favor instálalo desde https://ollama.ai")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("=" * 60)
    print("DESCARGAR Y COPIAR MODELOS DE OLLAMA")
    print("=" * 60)
    print()
    
    # Encontrar directorio de Ollama
    ollama_dir = find_ollama_models_dir()
    
    if not ollama_dir or not ollama_dir.exists():
        print("⚠ Directorio de modelos de Ollama no encontrado")
        print("  Intentando descargar modelo directamente...")
        model_name = input("\n📝 Nombre del modelo a descargar (ej: llama3): ").strip()
        
        if not model_name:
            print("❌ Nombre de modelo no válido")
            return
        
        if download_model_with_ollama(model_name):
            # Intentar copiar después de descargar
            ollama_dir = find_ollama_models_dir()
            if ollama_dir and ollama_dir.exists():
                portable_dir = Path(__file__).resolve().parent.parent / "portable_build"
                if portable_dir.exists():
                    copy_model_to_portable(model_name, ollama_dir, portable_dir)
        return
    
    print(f"📁 Directorio de Ollama encontrado: {ollama_dir}\n")
    
    # Listar modelos disponibles
    available_models = list_available_models(ollama_dir)
    
    if available_models:
        print("📋 Modelos disponibles:")
        for i, model in enumerate(available_models, 1):
            print(f"   {i}. {model}")
        print()
    else:
        print("⚠ No se encontraron modelos instalados")
        print("  Puedes descargar uno con: ollama pull llama3\n")
    
    # Obtener directorio portable
    portable_dir = Path(__file__).resolve().parent.parent / "portable_build"
    
    if not portable_dir.exists():
        print("⚠ Directorio portable_build no encontrado")
        print("  Ejecuta primero: python scripts/prepare_portable.py")
        return
    
    # Seleccionar modelo
    if available_models:
        choice = input("📝 Selecciona el número del modelo a copiar (o escribe el nombre): ").strip()
        
        if choice.isdigit():
            idx = int(choice) - 1
            if 0 <= idx < len(available_models):
                model_name = available_models[idx]
            else:
                print("❌ Selección inválida")
                return
        else:
            model_name = choice
    else:
        model_name = input("📝 Nombre del modelo a descargar (ej: llama3): ").strip()
        if not model_name:
            print("❌ Nombre de modelo no válido")
            return
        
        # Intentar descargar primero
        if not (ollama_dir / model_name).exists():
            if not download_model_with_ollama(model_name):
                return
    
    # Copiar modelo
    copy_model_to_portable(model_name, ollama_dir, portable_dir)
    
    print("\n" + "=" * 60)
    print("✅ PROCESO COMPLETADO")
    print("=" * 60)
    print(f"\n📦 El modelo está en: {portable_dir / 'ollama_models' / model_name}")
    print("\n💡 Nota: Para usar modelos portables, necesitas configurar Ollama")
    print("   para que lea desde esa carpeta, o usar una versión portable de Ollama")

if __name__ == "__main__":
    main()
















