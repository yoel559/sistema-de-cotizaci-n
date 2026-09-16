"""Script para probar la conexión con Ollama /api/chat"""
import httpx
import asyncio
import json

async def test_ollama_chat():
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "model": "qwen3:8b",
                "messages": [
                    {"role": "user", "content": "hola"}
                ],
                "stream": False
            }
            print(f"Probando: http://localhost:11434/api/chat")
            print(f"Payload: {json.dumps(payload, indent=2)}")
            
            response = await client.post(
                "http://localhost:11434/api/chat",
                json=payload
            )
            
            print(f"\nStatus Code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
            if response.status_code == 200:
                print("\n[OK] Ollama /api/chat funciona correctamente")
                return True
            else:
                print(f"\n[ERROR] Ollama respondió con código {response.status_code}")
                return False
                
    except httpx.HTTPStatusError as e:
        print(f"\n[ERROR] HTTP Status Error: {e.response.status_code}")
        print(f"Response: {e.response.text[:500]}")
        return False
    except httpx.ConnectError as e:
        print(f"\n[ERROR] No se puede conectar a Ollama: {e}")
        return False
    except httpx.HTTPStatusError as e:
        print(f"\n[ERROR] HTTP Status Error: {e.response.status_code}")
        print(f"Response: {e.response.text[:500]}")
        print(f"Request URL: {e.request.url}")
        return False
    except httpx.RequestError as e:
        print(f"\n[ERROR] Request Error: {type(e).__name__}: {e}")
        return False
    except Exception as e:
        print(f"\n[ERROR] Error inesperado: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_ollama_chat())

