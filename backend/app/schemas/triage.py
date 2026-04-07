from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.db.models import Severity, CaseStatus

class PatientCreate(BaseModel):
    name: str = "Treated Patient"
    age: int = 25
    mrn: str = "MRN-0001"
    gender: str = "Male"
    contact_info: Optional[str] = "example@healthcare.com"

class VitalsCreate(BaseModel):
    heart_rate: int = 80
    blood_pressure: str = "120/80"
    spo2: int = 98
    temperature: float = 98.6

class TriageAnalyzeRequest(BaseModel):
    patient_id: Optional[int] = None
    patient_info: Optional[PatientCreate] = None
    vitals: VitalsCreate
    symptoms: str = "Chest pain and shortness of breath."

class InsightResponse(BaseModel):
    summary: str
    risk_level: str
    key_findings: List[str]
    clinical_flags: List[str]
    recommended_action: str
    confidence_note: str
    disclaimer: str

class TriageAnalyzeResponse(BaseModel):
    severity: Severity
    confidence: float
    insight: InsightResponse

class TriageCaseOut(BaseModel):
    id: int
    patient_name: str
    mrn: str
    severity: Severity
    status: CaseStatus
    arrival_time: datetime
    vitals: Optional[Dict[str, Any]]
    symptoms: Optional[str]
    clinical_insight: Optional[Dict[str, Any]] = None
    eeg_report: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
