"""Prueba exactamente lo que hace el backend"""
import httpx
import asyncio
import json

async def test_exact_backend_request():
    """Prueba el request exacto que hace el backend"""
    
    model = "qwen3:8b"
    ollama_url = "http://localhost:11434"
    
    # Construir el payload exacto que usa el backend
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Eres un asistente virtual."},
            {"role": "user", "content": "hola"}
        ],
        "stream": True,  # El backend usa streaming
        "options": {
            "temperature": 0.7,
            "top_p": 0.9
        }
    }
    
    print("="*60)
    print("PRUEBA EXACTA DEL REQUEST DEL BACKEND")
    print("="*60)
    print(f"\nURL: {ollama_url}/api/chat")
    print(f"Modelo: {model}")
    print(f"\nPayload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            print(f"\n[*] Enviando request...")
            
            async with client.stream(
                "POST",
                f"{ollama_url}/api/chat",
                json=payload
            ) as response:
                print(f"\n[*] Status Code: {response.status_code}")
                print(f"[*] Headers: {dict(response.headers)}")
                
                if response.status_code != 200:
                    error_text = await response.aread()
                    print(f"\n[ERROR] Status {response.status_code}")
                    print(f"[ERROR] Response: {error_text.decode('utf-8', errors='ignore')[:500]}")
                    return False
                
                print(f"\n[OK] Streaming iniciado correctamente")
                print(f"[*] Leyendo líneas...")
                
                line_count = 0
                async for line in response.aiter_lines():
                    if line:
                        line_count += 1
                        try:
                            data = json.loads(line)
                            if "message" in data and "content" in data["message"]:
                                content = data["message"]["content"]
                                print(f"   Chunk {line_count}: {content[:50]}...")
                            if data.get("done", False):
                                print(f"\n[OK] Stream completado. Total chunks: {line_count}")
                                return True
                        except json.JSONDecodeError:
                            print(f"   [WARNING] Línea no JSON: {line[:100]}")
                            continue
                
                print(f"\n[OK] Stream terminado. Total chunks: {line_count}")
                return True
                
    except httpx.HTTPStatusError as e:
        print(f"\n[ERROR] HTTP Status Error: {e.response.status_code}")
        print(f"[ERROR] Response: {e.response.text[:500]}")
        print(f"[ERROR] Request URL: {e.request.url}")
        return False
    except httpx.ConnectError as e:
        print(f"\n[ERROR] No se puede conectar: {e}")
        return False
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_exact_backend_request())
    if result:
        print("\n" + "="*60)
        print("[OK] EL REQUEST FUNCIONA CORRECTAMENTE")
        print("="*60)
        print("\nEl problema podría estar en:")
        print("  1. El backend no se reinició después de los cambios")
        print("  2. El modelo no se está pasando correctamente")
        print("  3. Hay un problema con la autenticación del WebSocket")
    else:
        print("\n" + "="*60)
        print("[ERROR] EL REQUEST FALLA")
        print("="*60)
        print("\nPosibles soluciones:")
        print("  1. Verifica que Ollama esté corriendo: ollama serve")
        print("  2. Verifica el modelo: ollama list")
        print("  3. Prueba reinstalar el modelo: ollama pull qwen3:8b")















