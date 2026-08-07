import asyncio
import json
import websockets
import pandas as pd

class TelemetryStreamServer:
    def __init__(self, processed_df: pd.DataFrame, host: str = "localhost", port: int = 8765):
        self.df = processed_df
        self.host = host
        self.port = port
        self.connected_clients = set()

    async def register(self, websocket):
        self.connected_clients.add(websocket)
        print(f"[WS] Client connected: {websocket.remote_address}")

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
        """Groups telemetry by SessionTime and broadcasts each frame to connected clients."""
        print("🏎️ Starting live telemetry stream broadcast...")
        grouped = self.df.groupby('SessionTime')

        for timestamp, frame in grouped:
            if not self.connected_clients:
                await asyncio.sleep(0.1)
                continue

            records = frame.to_dict(orient='records')
            payload = json.dumps(records, default=str)

            # Safely send payload to all connected clients
            websockets.broadcast(self.connected_clients, payload)
            await asyncio.sleep(0.1)