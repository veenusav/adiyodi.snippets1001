import asyncio
import websockets
import json
import random
import time

async def generate_data(websocket, path):
    try:
        while True:
            data = {
                "x": [random.uniform(-10, 10) for _ in range(10)],
                "y": [random.uniform(0, 20) for _ in range(10)],
                "z": [random.uniform(0, 1000) for _ in range(10)],
                "timestamp": int(time.time() * 1000)  
            }
            print(f"Emitting data: {data}")
            await websocket.send(json.dumps(data))
            await asyncio.sleep(10)
    except websockets.ConnectionClosed as e:
        print(f"Connection closed: {e}")

start_server = websockets.serve(generate_data, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
print("WebSocket server started on ws://localhost:8765")
asyncio.get_event_loop().run_forever()
