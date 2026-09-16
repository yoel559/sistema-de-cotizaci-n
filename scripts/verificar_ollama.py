"""
Script rápido para verificar que Ollama esté instalado y funcionando
"""
import subprocess
import sys
import httpx
import asyncio
import os

# Configurar encoding para Windows
if sys.platform == 'win32':
    os.system('chcp 65001 >nul 2>&1')

def check_ollama_installed():
    """Verifica que Ollama esté instalado"""
    print("[*] Verificando instalacion de Ollama...")
    try:
        result = subprocess.run(
            ["ollama", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print(f"   [OK] Ollama instalado: {result.stdout.strip()}")
            return True
        else:
            print("   [ERROR] Ollama no responde correctamente")
            return False
    except FileNotFoundError:
        print("   [ERROR] Ollama no esta instalado")
        print("      Descarga desde: https://ollama.ai")
        return False
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
        return False

async def check_ollama_running():
    """Verifica que Ollama esté corriendo"""
    print("\n[*] Verificando que Ollama este corriendo...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                print("   [OK] Ollama esta corriendo en http://localhost:11434")
                return True
            else:
                print(f"   [ERROR] Ollama responde con codigo {response.status_code}")
                return False
    except httpx.ConnectError:
        print("   [ERROR] Ollama no esta corriendo")
        print("      Inicia Ollama con: ollama serve")
        return False
    except Exception as e:
        print(f"   [ERROR] Error conectando: {e}")
        return False

async def check_models():
    """Verifica que haya modelos disponibles"""
    print("\n[*] Verificando modelos disponibles...")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [model['name'] for model in data.get('models', [])]
                
                if models:
                    print(f"   [OK] {len(models)} modelo(s) encontrado(s):")
                    for model in models:
                        print(f"      - {model}")
                    return True
                else:
                    print("   [ADVERTENCIA] No hay modelos instalados")
                    print("      Descarga uno con: ollama pull llama3")
                    return False
            else:
                print("   [ERROR] No se pudo obtener la lista de modelos")
                return False
    except Exception as e:
        print(f"   [ERROR] Error: {e}")
        return False

def main():
    print("=" * 60)
    print("VERIFICACIÓN DE OLLAMA")
    print("=" * 60)
    print()
    
    # Verificar instalación
    installed = check_ollama_installed()
    
    if not installed:
        print("\n" + "=" * 60)
        print("[ERROR] OLLAMA NO ESTA INSTALADO")
        print("=" * 60)
        print("\nPasos para instalar:")
        print("   1. Ve a https://ollama.ai")
        print("   2. Descarga e instala Ollama para tu sistema")
        print("   3. Reinicia tu terminal")
        print("   4. Ejecuta este script nuevamente")
        return 1
    
    # Verificar que esté corriendo
    running = asyncio.run(check_ollama_running())
    
    if not running:
        print("\n" + "=" * 60)
        print("[ERROR] OLLAMA NO ESTA CORRIENDO")
        print("=" * 60)
        print("\nPara iniciar Ollama:")
        print("   1. Abre una nueva terminal")
        print("   2. Ejecuta: ollama serve")
        print("   3. Deja esa terminal abierta")
        print("   4. Ejecuta este script nuevamente")
        return 1
    
    # Verificar modelos
    has_models = asyncio.run(check_models())
    
    if not has_models:
        print("\n" + "=" * 60)
        print("[ADVERTENCIA] NO HAY MODELOS INSTALADOS")
        print("=" * 60)
        print("\nPara descargar un modelo:")
        print("   ollama pull llama3")
        print("\n   O para un modelo mas pequeno:")
        print("   ollama pull llama3.2")
        return 1
    
    print("\n" + "=" * 60)
    print("[OK] TODO ESTA CONFIGURADO CORRECTAMENTE")
    print("=" * 60)
    print("\nEl chatbot deberia funcionar ahora.")
    print("   Si aun ves errores, verifica que el backend este corriendo.")
    return 0

if __name__ == "__main__":
    sys.exit(main())


