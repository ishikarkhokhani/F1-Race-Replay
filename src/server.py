import asyncio
import json
import websockets

class TelemetryStreamServer:
    def __init__(self, host: str = "localhost", port: int = 8765):
        self.host = host
        self.port = port
        self.connected_clients = set()

    async def register(self, websocket):
        self.connected_clients.add(websocket)
        print(f"Client connected: {websocket.remote_address}")

    async def unregister(self, websocket):
        self.connected_clients.remove(websocket)
        print(f"Client disconnected: {websocket.remote_address}")

    async def handler(self, websocket, path):
        await self.register(websocket)
        try:
            async for message in websocket:
                pass  # Keep connection open for push broadcast
        finally:
            await self.unregister(websocket)

    async def broadcast_frame(self, frame_data: dict):
        if self.connected_clients:
            message = json.dumps(frame_data)
            await asyncio.gather(
                *[client.send(message) for client in self.connected_clients],
                return_exceptions=True
            )

    def start(self):
        server = websockets.serve(self.handler, self.host, self.port)
        print(f"WebSocket Telemetry Streamer running on ws://{self.host}:{self.port}")
        return server