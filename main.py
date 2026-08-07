import sys
import os
import asyncio
import argparse
import logging

sys.path.insert(0, os.getcwd())

from src.ingester import F1DataIngester
from src.processor import TelemetryProcessor
from src.server import TelemetryStreamServer
import websockets

async def run_engine(args):
    print(f"🏎️ Initializing F1 Race Replay for {args.year} {args.gp}...")
    ingester = F1DataIngester()
    session = ingester.load_session(args.year, args.gp)

    circuit_layout = ingester.get_circuit_layout(session)

    telemetry_data = {}
    for driver in args.drivers:
        print(f"Loading telemetry for {driver}...")
        telemetry_data[driver] = ingester.extract_driver_telemetry(session, driver)

    print("Aligning multi-driver telemetry streams...")
    processed_stream = TelemetryProcessor.align_multi_driver_telemetry(telemetry_data)
    print(f"✅ Ingestion complete. Total aligned samples: {len(processed_stream)}")

    # Silence noisy handshake failure logs from React strict mode / HMR reconnects
    logging.getLogger("websockets.server").setLevel(logging.ERROR)
    logging.getLogger("websockets.protocol").setLevel(logging.ERROR)

    server = TelemetryStreamServer(processed_stream, circuit_layout, host="0.0.0.0", port=8765)
    
    # Start single clean WebSocket server
    async with websockets.serve(server.ws_handler, server.host, server.port):
        print(f"📡 WebSocket server listening on ws://127.0.0.1:{server.port}")
        # Run broadcasting loop concurrently without blocking new incoming connections
        asyncio.create_task(server.stream_telemetry())
        await asyncio.Future()  # Keep server running continuously

def main():
    parser = argparse.ArgumentParser(description="F1 Telemetry Processing & Streaming Engine")
    parser.add_argument("--year", type=int, default=2023, help="Season year")
    parser.add_argument("--gp", type=str, default="Monza", help="Grand Prix name")
    parser.add_argument("--drivers", nargs="+", default=["VER", "LEC", "HAM"], help="Driver codes")
    
    args = parser.parse_args()
    asyncio.run(run_engine(args))

if __name__ == "__main__":
    main()