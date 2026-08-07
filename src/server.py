import asyncio
import json
import websockets
import pandas as pd

class TelemetryStreamServer:
    def __init__(self, processed_df: pd.DataFrame, circuit_layout: list, host: str = "0.0.0.0", port: int = 8765):
        self.df = processed_df.fillna(0)
        self.circuit_layout = circuit_layout
        self.host = host
        self.port = port
        self.connected_clients = set()

    async def register(self, websocket):
        self.connected_clients.add(websocket)
        print(f"[WS] Client connected: {websocket.remote_address}")
        
        # Send track layout payload immediately upon connection
        init_payload = json.dumps({
            "type": "layout",
            "circuit": self.circuit_layout
        }, default=str)
        await websocket.send(init_payload)

    async def unregister(self, websocket):
        if websocket in self.connected_clients:
            self.connected_clients.remove(websocket)
            print(f"[WS] Client disconnected: {websocket.remote_address}")

    async def ws_handler(self, websocket):
        await self.register(websocket)
        try:
            async for message in websocket:
                pass
        except (websockets.exceptions.ConnectionClosed, websockets.exceptions.ConnectionClosedError):
            pass
        finally:
            await self.unregister(websocket)

    async def stream_telemetry(self):
        """Streams telemetry frames repeatedly to connected clients."""
        print("🏎️ Telemetry engine ready and waiting for WebSocket clients...")
        grouped = list(self.df.groupby('SessionTime'))

        while True:
            if not self.connected_clients:
                await asyncio.sleep(0.5)
                continue

            for timestamp, frame in grouped:
                if not self.connected_clients:
                    break

                records = frame.to_dict(orient='records')
                payload = json.dumps({
                    "type": "telemetry",
                    "data": records
                }, default=str)

                # Send payload to all active clients
                websockets.broadcast(self.connected_clients, payload)
                await asyncio.sleep(0.1)