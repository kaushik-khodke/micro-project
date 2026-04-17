import os
import pickle
import numpy as np
from typing import Dict, Any, Tuple, Optional
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

    def predict_triage_severity(self, vitals: Dict[str, Any], eeg_prediction: Optional[str] = None) -> Tuple[Severity, float]:
        """
        Predicts triage severity based on vitals using Random Forest or heuristic fallback.
        If eeg_prediction is provided (NORMAL/BORDERLINE/ABNORMAL), severity is escalated accordingly.
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
        
        # Mapping score to base Severity from vitals
        if score >= 0.8:
            base_severity = Severity.RED
            confidence = 0.95
        elif score >= 0.5:
            base_severity = Severity.ORANGE
            confidence = 0.88
        elif score >= 0.3:
            base_severity = Severity.YELLOW
            confidence = 0.82
        else:
            base_severity = Severity.GREEN
            confidence = 0.90

        # EEG-based severity escalation
        if eeg_prediction:
            eeg = eeg_prediction.upper()
            escalation_map = {
                # ABNORMAL EEG escalates one full severity level
                "ABNORMAL": {
                    Severity.GREEN:  Severity.YELLOW,
                    Severity.YELLOW: Severity.ORANGE,
                    Severity.ORANGE: Severity.RED,
                    Severity.RED:    Severity.RED,
                },
                # BORDERLINE EEG only bumps GREEN → YELLOW
                "BORDERLINE": {
                    Severity.GREEN:  Severity.YELLOW,
                    Severity.YELLOW: Severity.YELLOW,
                    Severity.ORANGE: Severity.ORANGE,
                    Severity.RED:    Severity.RED,
                },
            }
            if eeg in escalation_map:
                base_severity = escalation_map[eeg].get(base_severity, base_severity)
                confidence = min(confidence + 0.05, 0.99)  # Boost confidence when EEG confirms

        return base_severity, confidence

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
