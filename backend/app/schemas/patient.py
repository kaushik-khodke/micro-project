from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
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
    lastVisit: Optional[datetime] = None # Added for frontend compatibility
    status: Optional[str] = "Stable" # Added for frontend compatibility
    priority: Optional[str] = "Normal" # Added for frontend compatibility

    model_config = ConfigDict(from_attributes=True)

    model_config = ConfigDict(from_attributes=True)
