import pandas as pd
import numpy as np

class TelemetryProcessor:
    @staticmethod
    def align_multi_driver_telemetry(driver_telemetry_dict: dict, freq_ms: int = 100):
        """
        Aligns multiple drivers' telemetry feeds to a uniform time grid (e.g. 100ms interval).
        """
        aligned_frames = []
        
        for driver, df in driver_telemetry_dict.items():
            if df.empty:
                continue
            
            df = df.copy()
            df['SessionTime'] = pd.to_timedelta(df['SessionTime'])
            df = df.set_index('SessionTime').resample(f'{freq_ms}ms').first().ffill().reset_index()
            df['Driver'] = driver
            aligned_frames.append(df)
            
        if not aligned_frames:
            return pd.DataFrame()

        combined = pd.concat(aligned_frames, ignore_index=True)
        return combined.sort_values(by=['SessionTime', 'Driver'])