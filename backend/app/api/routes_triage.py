from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Any
from app.db.session import get_db
from app.db import models
from app.schemas import triage as schemas
from app.services.random_forest_service import triage_model_service
from app.services.gemini_insight_service import gemini_service
import datetime

router = APIRouter()

@router.post("/analyze", response_model=schemas.TriageAnalyzeResponse)
async def analyze_triage(request: schemas.TriageAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyzes patient vitals and symptoms using Random Forest and Gemini 2.5 Flash.
    """
    # 1. Run Random Forest/Heuristic Severity scoring
    severity, confidence = triage_model_service.predict_triage_severity(request.vitals.dict())
    
    # 2. Generate Gemini Health Insights
    insight = await gemini_service.generate_triage_insight(
        vitals=request.vitals.dict(),
        symptoms=request.symptoms,
        model_severity=severity.value
    )
    
    return schemas.TriageAnalyzeResponse(
        severity=severity,
        confidence=confidence,
        insight=insight
    )

@router.post("/admit", response_model=schemas.TriageCaseOut)
async def admit_patient(request: schemas.TriageAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Admits a patient into the live triage queue based on analysis results.
    """
    # Find or Create Patient
    patient = None
    if request.patient_id:
        patient = db.query(models.Patient).filter(models.Patient.id == request.patient_id).first()
    
    if not patient and request.patient_info:
        patient = models.Patient(
            name=request.patient_info.name,
            mrn=request.patient_info.mrn,
            age=request.patient_info.age,
            gender=request.patient_info.gender,
            contact_info=request.patient_info.contact_info
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)
    
    if not patient:
        raise HTTPException(status_code=400, detail="Patient identification required.")

    # Calculate severity first (Crucial: was missing before!)
    severity, confidence = triage_model_service.predict_triage_severity(request.vitals.dict())

    # Generate Gemini Health Insights for admission
    insight = await gemini_service.generate_triage_insight(
        vitals=request.vitals.dict(),
        symptoms=request.symptoms,
        model_severity=severity.value
    )

    # Create Triage Case with insight
    new_case = models.TriageCase(
        patient_id=patient.id,
        severity=severity,
        status=models.CaseStatus.PENDING,
        clinical_insight=insight.dict() if hasattr(insight, 'dict') else insight
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Store Vitals and Symptoms
    db_vitals = models.Vitals(
        case_id=new_case.id,
        heart_rate=request.vitals.heart_rate,
        blood_pressure=request.vitals.blood_pressure,
        spo2=request.vitals.spo2,
        temperature=request.vitals.temperature
    )
    db_symptoms = models.Symptoms(
        case_id=new_case.id,
        complaint_text=request.symptoms
    )
    db.add(db_vitals)
    db.add(db_symptoms)
    db.commit()

    return schemas.TriageCaseOut(
        id=new_case.id,
        patient_name=patient.name,
        mrn=patient.mrn,
        severity=new_case.severity,
        status=new_case.status,
        arrival_time=new_case.arrival_time,
        vitals=request.vitals.dict(),
        symptoms=request.symptoms,
        clinical_insight=new_case.clinical_insight
    )

@router.get("/queue", response_model=List[schemas.TriageCaseOut])
async def get_triage_queue(db: Session = Depends(get_db)):
    """
    Returns the live prioritized queue of patients.
    """
    cases = db.query(models.TriageCase).filter(
        models.TriageCase.status == models.CaseStatus.PENDING
    ).order_by(
        models.TriageCase.severity.asc(), # Note: Enums are often ordered alphabetically unless mapped
        models.TriageCase.arrival_time.asc()
    ).all()
    
    # Custom sorting logic because Enum alphabetical order (GREEN, ORANGE, RED, YELLOW) isn't clinical
    severity_order = {
        models.Severity.RED: 0,
        models.Severity.ORANGE: 1,
        models.Severity.YELLOW: 2,
        models.Severity.GREEN: 3
    }
    
    cases.sort(key=lambda x: severity_order.get(x.severity, 99))
    
    results = []
    for case in cases:
        # Properly build vitals dict without SQLAlchemy state
        vitals_dict = None
        if case.vitals:
            vitals_dict = {
                "heart_rate": case.vitals.heart_rate,
                "blood_pressure": case.vitals.blood_pressure,
                "spo2": case.vitals.spo2,
                "temperature": case.vitals.temperature
            }

        # Fetch the most recent completed EEG study for the patient
        eeg_study = db.query(models.EEGStudy).filter(
            models.EEGStudy.patient_id == case.patient_id,
            models.EEGStudy.status == "COMPLETED"
        ).order_by(models.EEGStudy.id.desc()).first()
        
        eeg_info = None
        if eeg_study:
            # Need to get insight from AIResult linked to this study
            ai_res = db.query(models.AIResult).filter(models.AIResult.study_id == eeg_study.id).first()
            eeg_info = {
                "id": eeg_study.id,
                "file_name": eeg_study.file_name,
                "prediction": ai_res.prediction_label if ai_res else "UNKNOWN",
                "insight": ai_res.gemini_insight if ai_res else None
            }

        # Use the clinical_insight JSON column stored directly on TriageCase
        clinical_insight_dict = case.clinical_insight if case.clinical_insight else None

        results.append(schemas.TriageCaseOut(
            id=case.id,
            patient_name=case.patient.name,
            mrn=case.patient.mrn,
            severity=case.severity,
            status=case.status,
            arrival_time=case.arrival_time,
            vitals=vitals_dict,
            symptoms=case.symptoms.complaint_text if case.symptoms else None,
            clinical_insight=clinical_insight_dict,
            eeg_report=eeg_info
        ))
    
    return results

@router.patch("/{case_id}/status")
async def update_case_status(case_id: int, status: models.CaseStatus, db: Session = Depends(get_db)):
    case = db.query(models.TriageCase).filter(models.TriageCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    case.status = status
    db.commit()
    return {"message": "Status updated successfully", "new_status": status.value}
