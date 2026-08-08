import argparse
import asyncio
import pandas as pd
from src.ingester import FastF1Ingester
from src.processor import TelemetryProcessor
from src.server import TelemetryServer

server = TelemetryServer()
current_stream_task = None
current_year = 2023
current_gp = "Monza"
current_drivers = ["VER", "LEC", "HAM"]

session_cache = {}

async def stream_telemetry_loop(aligned_df):
    grouped = aligned_df.groupby('SessionTime')
    for _, frame in grouped:
        frame_data = frame.to_dict(orient='records')
        for row in frame_data:
            for k, v in list(row.items()):
                if isinstance(v, (pd.Timestamp, pd.Timedelta)):
                    row[k] = str(v)
                elif pd.isna(v):
                    row[k] = None

        await server.broadcast({"type": "telemetry", "data": frame_data})
        await asyncio.sleep(0.1)

async def load_and_stream_session(year: int, gp: str, drivers: list):
    global current_stream_task, current_year, current_gp, current_drivers

    current_year = year
    current_gp = gp
    current_drivers = drivers

    # Cancel ongoing stream if active
    if current_stream_task and not current_stream_task.done():
        current_stream_task.cancel()
        try:
            await current_stream_task
        except asyncio.CancelledError:
            pass

    cache_key = (year, gp)

    # Use cached ingester if session is already in memory
    if cache_key in session_cache:
        print(f"[Cache Hit] Reusing loaded session for {gp} ({year})")
        ingester = session_cache[cache_key]
    else:
        print(f"[Cache Miss] Loading session data for {gp} ({year})...")
        ingester = FastF1Ingester(year=year, gp=gp, session_type='R')
        ingester.load_session()
        session_cache[cache_key] = ingester

    layout = ingester.get_circuit_layout()
    available_drivers = ingester.get_driver_list()

    # Fast telemetry extraction from in-memory session
    telemetry_dict = ingester.get_multi_driver_telemetry(drivers)
    aligned_df = TelemetryProcessor.align_multi_driver_telemetry(telemetry_dict)

    if aligned_df.empty:
        return

    # Broadcast layout, full grid, and active driver list
    await server.broadcast({
        "type": "layout",
        "circuit": layout,
        "circuitName": f"{gp} GP",
        "availableDrivers": available_drivers,
        "activeDrivers": drivers
    })

    current_stream_task = asyncio.create_task(stream_telemetry_loop(aligned_df))

async def handle_circuit_change(year: int, gp: str):
    await load_and_stream_session(year, gp, current_drivers)

async def handle_driver_change(drivers: list):
    await load_and_stream_session(current_year, current_gp, drivers)

async def main():
    parser = argparse.ArgumentParser(description="F1 Telemetry WebSocket Server")
    parser.add_argument("--year", type=int, default=2023)
    parser.add_argument("--gp", type=str, default="Monza")
    parser.add_argument("--drivers", nargs="+", default=["VER", "LEC", "HAM"])
    args = parser.parse_args()

    server.register_circuit_change_handler(handle_circuit_change)
    server.register_driver_change_handler(handle_driver_change)

    asyncio.create_task(load_and_stream_session(args.year, args.gp, args.drivers))
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())