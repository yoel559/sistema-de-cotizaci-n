#!/usr/bin/env python3
"""
Script simple para ejecutar FastAPI sin problemas de multiprocessing en Windows
"""
import sys
import os
import uvicorn

# Agregar el directorio del proyecto al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("Iniciando FastAPI Trading System...")
    print("Servidor disponible en: http://localhost:8000")
    print("Documentacion en: http://localhost:8000/docs")
    print("Health check en: http://localhost:8000/health")
    print("=" * 50)

    try:
        uvicorn.run(
            "app.main:app",
            host="127.0.0.1",
            port=8000,
            reload=False,  # Deshabilitado para evitar problemas en Windows
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\nServidor detenido por el usuario")
    except Exception as e:
        print(f"Error al iniciar el servidor: {e}")
        print("Sugerencias:")
        print("   1. Verificar que todas las dependencias esten instaladas")
        print("   2. Verificar que el puerto 8000 este disponible")
        print("   3. Ejecutar como administrador si es necesario")

