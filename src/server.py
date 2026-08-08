import asyncio
import json
import websockets

class TelemetryServer:
    def __init__(self, host="127.0.0.1", port=8765):
        self.host = host
        self.port = port
        self.clients = set()
        self.on_circuit_change = None

    def register_circuit_change_handler(self, handler):
        self.on_circuit_change = handler

    def register_driver_change_handler(self, handler_func):
        self.on_driver_change = handler_func

    async def register(self, websocket):
        self.clients.add(websocket)
        print(f"[WS] Client connected: {websocket.remote_address}")

    async def unregister(self, websocket):
        self.clients.remove(websocket)
        print(f"[WS] Client disconnected: {websocket.remote_address}")

    async def handler(self, websocket):
        await self.register(websocket)
        try:
            async for message in websocket:
                try:
                    data = json.loads(message)
                    msg_type = data.get("type")

                    if msg_type == "select_session" and self.on_circuit_change:
                        gp = data.get("gp")
                        year = data.get("year", 2023)
                        print(f"[WS] Received request to switch to GP: {gp} ({year})")
                        await self.on_circuit_change(year, gp)

                    elif msg_type == "switch_drivers" and getattr(self, "on_driver_change", None):
                        drivers = data.get("drivers", [])
                        print(f"[WS] Received request to switch drivers: {drivers}")
                        await self.on_driver_change(drivers)

                except Exception as e:
                    print(f"[WS] Error handling message: {e}")
        except websockets.exceptions.ConnectionClosedError:
            pass
        finally:
            await self.unregister(websocket)

    async def broadcast(self, message: dict):
        if not self.clients:
            return
        payload = json.dumps(message)
        await asyncio.gather(
            *[client.send(payload) for client in self.clients],
            return_exceptions=True
        )

    async def start(self):
        async with websockets.serve(self.handler, self.host, self.port):
            print(f"📡 WebSocket server listening on ws://{self.host}:{self.port}")
            await asyncio.Future()