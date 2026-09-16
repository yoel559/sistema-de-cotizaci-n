import websocket
import time
import json

def test_websocket():
    try:
        print("Connecting to WebSocket...")
        ws = websocket.create_connection('ws://localhost:8000/api/v1/ws/test/123')
        print('WebSocket connection successful')

        # Send a test message
        test_msg = {'type': 'test', 'message': 'Hello from Python client'}
        ws.send(json.dumps(test_msg))
        print('Sent test message:', test_msg)

        # Wait for response
        result = ws.recv()
        print('Received response:', result)

        ws.close()
        print('Connection closed')

    except Exception as e:
        print('WebSocket test failed:', str(e))

if __name__ == "__main__":
    test_websocket()
