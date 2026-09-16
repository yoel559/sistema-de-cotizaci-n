"""Script para probar el backend"""
import httpx
import asyncio

async def test_backend():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            print("Probando http://localhost:8000/api/v1/chatbot/status...")
            response = await client.get("http://localhost:8000/api/v1/chatbot/status")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Conectado: {data.get('connected')}")
                print(f"Modelos: {data.get('available_models')}")
                print(f"Error: {data.get('error')}")
            else:
                print(f"Response: {response.text}")
    except httpx.ConnectError:
        print("ERROR: El backend no está corriendo en http://localhost:8000")
        print("Inicia el backend con: cd backend && uvicorn app.main:app --reload")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_backend())















