import fastf1
import pandas as pd

class FastF1Ingester:
    def __init__(self, year: int = 2023, gp: str = "Monza", session_type: str = "R"):
        self.year = year
        self.gp = gp
        self.session_type = session_type
        self.session = None

    def load_session(self):
        fastf1.Cache.enable_cache("data")
        self.session = fastf1.get_session(self.year, self.gp, self.session_type)
        self.session.load()

    def get_circuit_layout(self):
        if not self.session:
            self.load_session()
        lap = self.session.laps.pick_fastest()
        pos = lap.get_pos_data()
        pos = pos.dropna(subset=['X', 'Y'])
        return pos[['X', 'Y', 'Z']].to_dict(orient='records')

    def get_driver_telemetry(self, driver_code: str):
        if not self.session:
            self.load_session()
        laps = self.session.laps.pick_drivers(driver_code)
        if laps.empty:
            return pd.DataFrame()
        telemetry = laps.get_telemetry()
        if not telemetry.empty and 'X' in telemetry.columns and 'Y' in telemetry.columns:
            telemetry = telemetry.dropna(subset=['X', 'Y'])
        return telemetry