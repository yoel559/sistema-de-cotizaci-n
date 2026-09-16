"""
Script para verificar que todo esté listo para el sistema portable
"""
import os
import sys
from pathlib import Path

def check_python():
    """Verifica que Python esté instalado"""
    print("🐍 Verificando Python...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"   ✅ Python {version.major}.{version.minor}.{version.micro} instalado")
        return True
    else:
        print(f"   ❌ Python {version.major}.{version.minor} encontrado, se requiere 3.8+")
        return False

def check_venv(portable_dir):
    """Verifica que el entorno virtual exista"""
    print("\n📦 Verificando entorno virtual...")
    venv_path = portable_dir / "python_env"
    
    if not venv_path.exists():
        print("   ❌ Entorno virtual no encontrado")
        return False
    
    # Verificar Python en el venv
    if os.name == "nt":  # Windows
        python_exe = venv_path / "Scripts" / "python.exe"
    else:  # Linux/Mac
        python_exe = venv_path / "bin" / "python"
    
    if python_exe.exists():
        print("   ✅ Entorno virtual encontrado")
        return True
    else:
        print("   ❌ Python no encontrado en el entorno virtual")
        return False

def check_backend(portable_dir):
    """Verifica que el backend esté presente"""
    print("\n🔧 Verificando backend...")
    backend_dir = portable_dir / "backend"
    app_dir = backend_dir / "app"
    
    if app_dir.exists():
        print("   ✅ Backend encontrado")
        return True
    else:
        print("   ❌ Backend no encontrado")
        return False

def check_frontend(portable_dir):
    """Verifica que el frontend esté presente"""
    print("\n🌐 Verificando frontend...")
    frontend_build = portable_dir / "frontend" / "build"
    
    if frontend_build.exists():
        index_file = frontend_build / "index.html"
        if index_file.exists():
            print("   ✅ Build del frontend encontrado")
            return True
    
    print("   ⚠ Build del frontend no encontrado")
    return False

def check_models(portable_dir):
    """Verifica que haya modelos disponibles"""
    print("\n🤖 Verificando modelos de IA...")
    models_dir = portable_dir / "ollama_models"
    
    if not models_dir.exists():
        print("   ⚠ Directorio de modelos no encontrado")
        return False
    
    models = [d for d in models_dir.iterdir() if d.is_dir()]
    
    if models:
        print(f"   ✅ {len(models)} modelo(s) encontrado(s):")
        for model in models:
            print(f"      - {model.name}")
        return True
    else:
        print("   ⚠ No se encontraron modelos")
        print("      Usa download_model.py para copiar modelos")
        return False

def check_ollama():
    """Verifica que Ollama esté instalado"""
    print("\n🔍 Verificando Ollama...")
    
    try:
        import subprocess
        result = subprocess.run(
            ["ollama", "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            print("   ✅ Ollama instalado")
            print(f"      {result.stdout.strip()}")
            return True
    except FileNotFoundError:
        print("   ⚠ Ollama no encontrado en PATH")
        print("      El chatbot no funcionará sin Ollama")
        return False
    except Exception as e:
        print(f"   ⚠ Error verificando Ollama: {e}")
        return False

def check_scripts(portable_dir):
    """Verifica que los scripts de inicio existan"""
    print("\n📝 Verificando scripts de inicio...")
    
    scripts_ok = True
    
    # Windows
    start_bat = portable_dir / "start.bat"
    if start_bat.exists():
        print("   ✅ start.bat encontrado")
    else:
        print("   ❌ start.bat no encontrado")
        scripts_ok = False
    
    # Linux/Mac
    start_sh = portable_dir / "start.sh"
    if start_sh.exists():
        if os.access(start_sh, os.X_OK):
            print("   ✅ start.sh encontrado y ejecutable")
        else:
            print("   ⚠ start.sh encontrado pero no ejecutable")
    else:
        print("   ⚠ start.sh no encontrado")
    
    return scripts_ok

def check_data_dir(portable_dir):
    """Verifica que el directorio de datos exista"""
    print("\n💾 Verificando directorio de datos...")
    data_dir = portable_dir / "data"
    
    if data_dir.exists():
        print("   ✅ Directorio de datos encontrado")
        return True
    else:
        print("   ⚠ Directorio de datos no encontrado (se creará automáticamente)")
        return True  # No es crítico, se crea automáticamente

def main():
    print("=" * 60)
    print("VERIFICACIÓN DEL SISTEMA PORTABLE")
    print("=" * 60)
    print()
    
    portable_dir = Path(__file__).resolve().parent.parent / "portable_build"
    
    if not portable_dir.exists():
        print("❌ Directorio portable_build no encontrado")
        print("   Ejecuta primero: python scripts/prepare_portable.py")
        return 1
    
    print(f"📁 Verificando: {portable_dir}\n")
    
    checks = [
        ("Python", check_python),
        ("Entorno Virtual", lambda: check_venv(portable_dir)),
        ("Backend", lambda: check_backend(portable_dir)),
        ("Frontend", lambda: check_frontend(portable_dir)),
        ("Modelos", lambda: check_models(portable_dir)),
        ("Ollama", check_ollama),
        ("Scripts", lambda: check_scripts(portable_dir)),
        ("Datos", lambda: check_data_dir(portable_dir)),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"   ❌ Error verificando {name}: {e}")
            results.append((name, False))
    
    print("\n" + "=" * 60)
    print("RESUMEN")
    print("=" * 60)
    
    all_ok = True
    for name, result in results:
        status = "✅" if result else "❌"
        print(f"{status} {name}")
        if not result and name in ["Python", "Entorno Virtual", "Backend"]:
            all_ok = False
    
    print()
    
    if all_ok:
        print("✅ Sistema portable listo para usar")
        print("\n📋 Próximos pasos:")
        print("   1. Copia la carpeta 'portable_build' a tu USB")
        print("   2. En el sistema destino, ejecuta start.bat o start.sh")
    else:
        print("❌ Hay problemas que deben resolverse antes de usar el sistema")
        print("   Revisa los errores arriba y ejecuta prepare_portable.py si es necesario")
    
    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
















