import os
import mne
import pandas as pd
from app.core.config import settings

class EEGCSVService:
    def __init__(self):
        self.csv_dir = os.path.join(settings.UPLOADS_DIR, "csv")
        os.makedirs(self.csv_dir, exist_ok=True)

    def get_csv_path(self, study_id: int) -> str:
        """Returns the expected CSV path for a given study ID."""
        return os.path.join(self.csv_dir, f"eeg_data_{study_id}.csv")

    def convert_edf_to_csv(self, edf_path: str, study_id: int) -> str:
        """
        Converts an EDF file to CSV format and saves it.
        Extracts timestamps and channel-wise signal data.
        """
        if not os.path.exists(edf_path):
            raise FileNotFoundError(f"EDF file not found: {edf_path}")

        csv_path = self.get_csv_path(study_id)
        
        try:
            # Load raw EDF data
            raw = mne.io.read_raw_edf(edf_path, preload=True, verbose=False)
            
            # Get data and times
            data, times = raw.get_data(return_times=True)
            channel_names = raw.ch_names

            # Create a DataFrame
            # Transpose data so columns are channels and rows are time points
            df = pd.DataFrame(data.T, columns=channel_names)
            
            # Insert timestamp column at the beginning
            df.insert(0, "timestamp", times)

            # Optimization: Downsample to save space and processing time if the file is huge
            # For a typical web report, 250Hz over hours is too much. 
            # We'll keep the full data but maybe limit precision to reduce file size.
            df = df.round(6) 

            # Save to CSV
            df.to_csv(csv_path, index=False)
            print(f"Successfully converted {edf_path} to {csv_path}")
            return csv_path
            
        except Exception as e:
            print(f"Error converting EDF to CSV: {str(e)}")
            import traceback
            traceback.print_exc()
            return ""

eeg_csv_service = EEGCSVService()
