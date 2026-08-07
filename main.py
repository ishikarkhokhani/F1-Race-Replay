import argparse
import asyncio
import pandas as pd
from src.ingester import FastF1Ingester
from src.processor import TelemetryProcessor
from src.server import TelemetryServer

server = TelemetryServer()
current_stream_task = None

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
    global current_stream_task
    
    if current_stream_task and not current_stream_task.done():
        current_stream_task.cancel()
        try:
            await current_stream_task
        except asyncio.CancelledError:
            pass

    ingester = FastF1Ingester(year=year, gp=gp, session_type='R')
    ingester.load_session()

    layout = ingester.get_circuit_layout()
    
    telemetry_dict = {}
    for driver in drivers:
        telemetry_dict[driver] = ingester.get_driver_telemetry(driver)
        
    aligned_df = TelemetryProcessor.align_multi_driver_telemetry(telemetry_dict)
    
    if aligned_df.empty:
        return

    await server.broadcast({"type": "layout", "circuit": layout, "circuitName": f"{gp} GP"})

    current_stream_task = asyncio.create_task(stream_telemetry_loop(aligned_df))

async def handle_circuit_change(year: int, gp: str):
    drivers = ["VER", "LEC", "HAM"]
    await load_and_stream_session(year, gp, drivers)

async def main():
    parser = argparse.ArgumentParser(description="F1 Telemetry WebSocket Server")
    parser.add_argument("--year", type=int, default=2023)
    parser.add_argument("--gp", type=str, default="Monza")
    parser.add_argument("--drivers", nargs="+", default=["VER", "LEC", "HAM"])
    args = parser.parse_args()

    server.register_circuit_change_handler(handle_circuit_change)

    asyncio.create_task(load_and_stream_session(args.year, args.gp, args.drivers))
    await server.start()

if __name__ == "__main__":
    asyncio.run(main())