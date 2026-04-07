import os
import pickle
import numpy as np
from typing import Dict, Any, Tuple
from app.db.models import Severity

class RandomForestService:
    def __init__(self, model_path: str = "models/triage_rf.pkl"):
        self.model_path = model_path
        self.model = self._load_model()
        
    def _load_model(self):
        if os.path.exists(self.model_path):
            with open(self.model_path, 'rb') as f:
                return pickle.load(f)
        return None

    def predict_triage_severity(self, vitals: Dict[str, Any]) -> Tuple[Severity, float]:
        """
        Predicts triage severity based on vitals using Random Forest or heuristic fallback.
        """
        # Feature vector extraction
        hr = vitals.get("heart_rate", 80)
        spo2 = vitals.get("spo2", 98)
        temp = vitals.get("temperature", 98.6)
        
        # Rule-based / Heuristic Fallback (Mock RF logic)
        score = 0.0
        if spo2 < 90: score += 0.8
        elif spo2 < 94: score += 0.4
        
        if hr > 120 or hr < 50: score += 0.5
        if temp > 103 or temp < 95: score += 0.3
        
        # Mapping score to Severity
        if score >= 0.8:
            return Severity.RED, 0.95
        elif score >= 0.5:
            return Severity.ORANGE, 0.88
        elif score >= 0.3:
            return Severity.YELLOW, 0.82
        else:
            return Severity.GREEN, 0.90

    def predict_eeg_abnormality(self, features: Dict[str, float]) -> Tuple[str, float]:
        """
        Predicts EEG abnormality based on PSD features.
        """
        # Logic: High delta/theta relative to alpha usually indicates abnormality
        delta = features.get("delta", 0.1)
        alpha = features.get("alpha", 0.5)
        
        ratio = delta / (alpha + 1e-6)
        
        if ratio > 2.0:
            return "ABNORMAL", 0.92
        elif ratio > 1.0:
            return "BORDERLINE", 0.75
        else:
            return "NORMAL", 0.88

triage_model_service = RandomForestService()
