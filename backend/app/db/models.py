import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship, DeclarativeBase
import enum

class Base(DeclarativeBase):
    pass

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    HOSPITAL = "HOSPITAL"
    DOCTOR = "DOCTOR"
    PATIENT = "PATIENT"

class Severity(str, enum.Enum):
    RED = "RED"
    ORANGE = "ORANGE"
    YELLOW = "YELLOW"
    GREEN = "GREEN"

class CaseStatus(str, enum.Enum):
    PENDING = "PENDING"
    ADMITTED = "ADMITTED"
    TREATED = "TREATED"
    DISCHARGED = "DISCHARGED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.DOCTOR)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    mrn = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    contact_info = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    triage_cases = relationship("TriageCase", back_populates="patient")
    eeg_studies = relationship("EEGStudy", back_populates="patient")

class TriageCase(Base):
    __tablename__ = "triage_cases"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    severity = Column(Enum(Severity), index=True)
    status = Column(Enum(CaseStatus), default=CaseStatus.PENDING)
    arrival_time = Column(DateTime, default=datetime.datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    clinical_insight = Column(JSON, nullable=True)
    
    patient = relationship("Patient", back_populates="triage_cases")
    vitals = relationship("Vitals", back_populates="case", uselist=False)
    symptoms = relationship("Symptoms", back_populates="case", uselist=False)

class Vitals(Base):
    __tablename__ = "vitals"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("triage_cases.id"))
    heart_rate = Column(Integer)
    blood_pressure = Column(String) # e.g., "120/80"
    spo2 = Column(Integer)
    temperature = Column(Float)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    case = relationship("TriageCase", back_populates="vitals")

class Symptoms(Base):
    __tablename__ = "symptoms"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("triage_cases.id"))
    complaint_text = Column(Text)
    onset_time = Column(String)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    case = relationship("TriageCase", back_populates="symptoms")

class EEGStudy(Base):
    __tablename__ = "eeg_studies"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"))
    file_path = Column(String, nullable=False)
    file_name = Column(String)
    file_type = Column(String) # "EDF", "PDF", or "IMAGE"
    status = Column(String, default="PROCESSING") # PROCESSING, COMPLETED, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="eeg_studies")
    ai_result = relationship("AIResult", back_populates="study", uselist=False)

class AIResult(Base):
    __tablename__ = "ai_results"
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("eeg_studies.id"), nullable=True)
    case_id = Column(Integer, ForeignKey("triage_cases.id"), nullable=True)
    model_score = Column(Float)
    prediction_label = Column(String)
    gemini_insight = Column(JSON) # Stores the structured JSON from Gemini
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    study = relationship("EEGStudy", back_populates="ai_result")
