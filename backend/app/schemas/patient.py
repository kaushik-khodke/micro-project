from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class PatientBase(BaseModel):
    name: str
    age: int
    mrn: str
    gender: Optional[str] = None
    contact_info: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    mrn: Optional[str] = None
    gender: Optional[str] = None
    contact_info: Optional[str] = None

class Patient(PatientBase):
    id: int
    created_at: datetime
    lastVisit: Optional[datetime] = None
    status: Optional[str] = "Stable"
    priority: Optional[str] = "Normal"

    model_config = ConfigDict(from_attributes=True)
