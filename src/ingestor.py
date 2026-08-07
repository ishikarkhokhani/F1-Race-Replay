import os
import fastf1
import pandas as pd

class F1DataIngester:
    def __init__(self, cache_dir: str = "./data/cache"):
        os.makedirs(cache_dir, exist_ok=True)
        fastf1.Cache.enable_cache(cache_dir)

    def load_session(self, year: int, grand_prix: str, session_type: str = 'R'):
        """Loads session data (e.g., year=2023, grand_prix='Monza', session_type='R')"""
        session = fastf1.get_session(year, grand_prix, session_type)
        session.load(telemetry=True, laps=True, weather=False)
        return session

    def extract_driver_telemetry(self, session, driver_code: str):
        """Extracts telemetry telemetry data for a specific driver."""
        laps = session.laps.pick_driver(driver_code)
        telemetry = laps.get_telemetry()
        return telemetry[['Date', 'SessionTime', 'Speed', 'RPM', 'nGear', 'Throttle', 'Brake', 'DRS', 'X', 'Y', 'Z']]