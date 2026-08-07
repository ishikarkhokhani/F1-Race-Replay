import argparse
import time
import asyncio
from src.ingester import F1DataIngester
from src.processor import TelemetryProcessor

def main():
    parser = argparse.ArgumentParser(description="F1 Telemetry Processing & Streaming Engine")
    parser.add_argument("--year", type=int, default=2023, help="Season year")
    parser.add_argument("--gp", type=str, default="Monza", help="Grand Prix name")
    parser.add_argument("--drivers", nargs="+", default=["VER", "LEC", "HAM"], help="Driver codes")
    
    args = parser.parse_args()

    print(f"🏎️ Initializing F1 Race Replay for {args.year} {args.gp}...")
    ingester = F1DataIngester()
    session = ingester.load_session(args.year, args.gp)

    telemetry_data = {}
    for driver in args.drivers:
        print(f"Loading telemetry for {driver}...")
        telemetry_data[driver] = ingester.extract_driver_telemetry(session, driver)

    print("Aligning multi-driver telemetry streams...")
    processed_stream = TelemetryProcessor.align_multi_driver_telemetry(telemetry_data)
    print(f"✅ Ingestion complete. Total aligned samples: {len(processed_stream)}")

if __name__ == "__main__":
    main()