"""Diagnóstico completo del sistema de chatbot"""
import httpx
import asyncio
import json
import sys

async def test_ollama_directo():
    """Prueba la conexión directa con Ollama"""
    print("\n" + "="*60)
    print("1. PRUEBA DIRECTA CON OLLAMA")
    print("="*60)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Probar /api/tags
            print("\n[*] Probando /api/tags...")
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                data = response.json()
                models = [m['name'] for m in data.get('models', [])]
                print(f"   [OK] Ollama responde correctamente")
                print(f"   [OK] Modelos disponibles: {models}")
                return models
            else:
                print(f"   [ERROR] Ollama respondió con código {response.status_code}")
                return []
    except Exception as e:
        print(f"   [ERROR] No se puede conectar a Ollama: {e}")
        return []

async def test_ollama_chat(modelo):
    """Prueba el endpoint /api/chat de Ollama"""
    print("\n" + "="*60)
    print(f"2. PRUEBA DE /api/chat CON MODELO: {modelo}")
    print("="*60)
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "model": modelo,
                "messages": [
                    {"role": "user", "content": "hola"}
                ],
                "stream": False
            }
            print(f"\n[*] Enviando request a http://localhost:11434/api/chat")
            print(f"[*] Modelo: {modelo}")
            
            response = await client.post(
                "http://localhost:11434/api/chat",
                json=payload
            )
            
            print(f"\n[*] Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                message = data.get("message", {}).get("content", "")
                print(f"   [OK] Ollama /api/chat funciona correctamente")
                print(f"   [OK] Respuesta: {message[:100]}...")
                return True
            else:
                print(f"   [ERROR] Ollama respondió con código {response.status_code}")
                print(f"   [ERROR] Response: {response.text[:300]}")
                return False
                
    except httpx.HTTPStatusError as e:
        print(f"   [ERROR] HTTP Status Error: {e.response.status_code}")
        print(f"   [ERROR] Response: {e.response.text[:300]}")
        return False
    except httpx.ConnectError as e:
        print(f"   [ERROR] No se puede conectar a Ollama: {e}")
        return False
    except Exception as e:
        print(f"   [ERROR] Error inesperado: {type(e).__name__}: {e}")
        return False

async def test_backend_status():
    """Prueba el endpoint de status del backend"""
    print("\n" + "="*60)
    print("3. PRUEBA DEL BACKEND - ENDPOINT /status")
    print("="*60)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            print("\n[*] Probando http://localhost:8000/api/v1/chatbot/status...")
            response = await client.get("http://localhost:8000/api/v1/chatbot/status")
            
            print(f"\n[*] Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   [OK] Backend responde correctamente")
                print(f"   [OK] Conectado: {data.get('connected', False)}")
                print(f"   [OK] Modelos disponibles: {data.get('available_models', [])}")
                print(f"   [OK] Modelo por defecto: {data.get('default_model', 'N/A')}")
                if data.get('error'):
                    print(f"   [ADVERTENCIA] Error reportado: {data.get('error')}")
                return data
            else:
                print(f"   [ERROR] Backend respondió con código {response.status_code}")
                print(f"   [ERROR] Response: {response.text[:300]}")
                return None
                
    except httpx.ConnectError as e:
        print(f"   [ERROR] No se puede conectar al backend: {e}")
        print(f"   [INFO] Verifica que el backend esté corriendo en http://localhost:8000")
        return None
    except Exception as e:
        print(f"   [ERROR] Error inesperado: {type(e).__name__}: {e}")
        return None

async def test_backend_chat():
    """Prueba el endpoint de chat del backend"""
    print("\n" + "="*60)
    print("4. PRUEBA DEL BACKEND - ENDPOINT /chat")
    print("="*60)
    
    print("\n[INFO] Este endpoint requiere autenticación.")
    print("[INFO] Si tienes un token, puedes probarlo manualmente con:")
    print("   curl -X POST http://localhost:8000/api/v1/chatbot/chat \\")
    print("     -H 'Authorization: Bearer TU_TOKEN' \\")
    print("     -H 'Content-Type: application/json' \\")
    print("     -d '{\"message\": \"hola\"}'")

async def main():
    print("="*60)
    print("DIAGNÓSTICO COMPLETO DEL SISTEMA DE CHATBOT")
    print("="*60)
    
    # 1. Probar Ollama directamente
    models = await test_ollama_directo()
    
    if not models:
        print("\n" + "="*60)
        print("[ERROR] OLLAMA NO ESTÁ DISPONIBLE")
        print("="*60)
        print("\nSolución:")
        print("   1. Verifica que Ollama esté corriendo: ollama serve")
        print("   2. Verifica que Ollama esté instalado: ollama --version")
        return 1
    
    # 2. Probar /api/chat con el primer modelo disponible
    if models:
        modelo = models[0]
        chat_ok = await test_ollama_chat(modelo)
        
        if not chat_ok:
            print("\n" + "="*60)
            print("[ERROR] OLLAMA /api/chat NO FUNCIONA")
            print("="*60)
            print(f"\nEl modelo '{modelo}' podría tener problemas.")
            print("Intenta:")
            print(f"   1. Verificar el modelo: ollama show {modelo}")
            print(f"   2. Reinstalar el modelo: ollama pull {modelo}")
            return 1
    
    # 3. Probar backend
    backend_status = await test_backend_status()
    
    if backend_status is None:
        print("\n" + "="*60)
        print("[ERROR] BACKEND NO ESTÁ DISPONIBLE")
        print("="*60)
        print("\nSolución:")
        print("   1. Inicia el backend: cd backend && uvicorn app.main:app --reload")
        return 1
    
    # 4. Verificar consistencia
    print("\n" + "="*60)
    print("5. VERIFICACIÓN DE CONSISTENCIA")
    print("="*60)
    
    if models and backend_status:
        backend_models = backend_status.get('available_models', [])
        if set(models) != set(backend_models):
            print(f"\n[ADVERTENCIA] Los modelos no coinciden:")
            print(f"   Ollama tiene: {models}")
            print(f"   Backend reporta: {backend_models}")
            print("\n[INFO] El backend podría necesitar reiniciarse.")
        else:
            print(f"\n[OK] Los modelos coinciden: {models}")
    
    # Resumen final
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    
    if models and chat_ok and backend_status:
        print("\n[OK] Todo parece estar funcionando correctamente.")
        print("\nSi aún ves el error 404 en el frontend:")
        print("   1. Reinicia el backend completamente")
        print("   2. Limpia la caché del navegador (Ctrl+Shift+Delete)")
        print("   3. Recarga el frontend con Ctrl+F5")
        return 0
    else:
        print("\n[ERROR] Hay problemas que deben resolverse.")
        return 1

if __name__ == "__main__":
    sys.exit(asyncio.run(main()))















