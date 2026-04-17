from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from app.db.session import get_db
from app.db import models
from app.schemas import triage as schemas
from app.services.random_forest_service import triage_model_service
from app.services.gemini_insight_service import gemini_service
import datetime

router = APIRouter()


def _get_patient_eeg_context(patient_id: int, db: Session) -> Optional[dict]:
    """
    Fetches the most recent completed EEG study for a patient and returns
    a context dict suitable for passing to the severity model and Gemini.
    Returns None if no completed EEG exists.
    """
    eeg_study = db.query(models.EEGStudy).filter(
        models.EEGStudy.patient_id == patient_id,
        models.EEGStudy.status == "COMPLETED"
    ).order_by(models.EEGStudy.id.desc()).first()

    if not eeg_study:
        return None

    ai_res = db.query(models.AIResult).filter(
        models.AIResult.study_id == eeg_study.id
    ).first()

    if not ai_res:
        return None

    insight = ai_res.gemini_insight or {}
    return {
        "study_id": eeg_study.id,
        "file_name": eeg_study.file_name,
        "prediction": ai_res.prediction_label or "UNKNOWN",
        "summary": insight.get("summary", ""),
        "risk_level": insight.get("risk_level", "Unknown"),
        "key_findings": insight.get("key_findings", []),
        "clinical_flags": insight.get("clinical_flags", []),
    }


@router.post("/analyze", response_model=schemas.TriageAnalyzeResponse)
async def analyze_triage(request: schemas.TriageAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyzes patient vitals and symptoms using Random Forest and Gemini.
    If the patient has a completed EEG study, it is factored into the severity score.
    """
    # Fetch EEG context if patient_id provided
    eeg_context = None
    if request.patient_id:
        eeg_context = _get_patient_eeg_context(request.patient_id, db)

    # 1. Run severity scoring (with optional EEG escalation)
    eeg_prediction = eeg_context["prediction"] if eeg_context else None
    severity, confidence = triage_model_service.predict_triage_severity(
        request.vitals.dict(), eeg_prediction=eeg_prediction
    )

    # 2. Generate Gemini Health Insights (with EEG context if available)
    insight = await gemini_service.generate_triage_insight(
        vitals=request.vitals.dict(),
        symptoms=request.symptoms,
        model_severity=severity.value,
        eeg_context=eeg_context
    )

    return schemas.TriageAnalyzeResponse(
        severity=severity,
        confidence=confidence,
        insight=insight
    )


@router.post("/admit", response_model=schemas.TriageCaseOut)
async def admit_patient(request: schemas.TriageAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Admits a patient into the live triage queue.
    If the patient has a completed EEG study, it is factored into the severity score and AI insight.
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

    # Fetch EEG context for this patient (if any completed study exists)
    eeg_context = _get_patient_eeg_context(patient.id, db)
    eeg_prediction = eeg_context["prediction"] if eeg_context else None

    # Calculate severity (with EEG escalation if available)
    severity, confidence = triage_model_service.predict_triage_severity(
        request.vitals.dict(), eeg_prediction=eeg_prediction
    )

    # Generate Gemini insight (with EEG context injected into prompt)
    insight = await gemini_service.generate_triage_insight(
        vitals=request.vitals.dict(),
        symptoms=request.symptoms,
        model_severity=severity.value,
        eeg_context=eeg_context
    )

    # Store whether EEG was used at admission time
    insight_to_store = insight.dict() if hasattr(insight, 'dict') else insight
    if isinstance(insight_to_store, dict):
        insight_to_store["_eeg_informed"] = bool(eeg_context)
        insight_to_store["_eeg_prediction"] = eeg_prediction

    # Create Triage Case
    new_case = models.TriageCase(
        patient_id=patient.id,
        severity=severity,
        status=models.CaseStatus.PENDING,
        clinical_insight=insight_to_store
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
        clinical_insight=new_case.clinical_insight,
        eeg_report=eeg_context
    )


@router.post("/reevaluate/{patient_id}")
async def reevaluate_triage_for_patient(patient_id: int, db: Session = Depends(get_db)):
    """
    Called automatically after an EEG study completes for a patient.
    Re-evaluates all PENDING triage cases for that patient using the new EEG data.
    Updates severity and clinical insight in real-time.
    """
    # Get the newly completed EEG context
    eeg_context = _get_patient_eeg_context(patient_id, db)
    if not eeg_context:
        return {"message": "No completed EEG found for patient", "updated": 0}

    # Find all pending triage cases for this patient
    pending_cases = db.query(models.TriageCase).filter(
        models.TriageCase.patient_id == patient_id,
        models.TriageCase.status == models.CaseStatus.PENDING
    ).all()

    if not pending_cases:
        return {"message": "No pending triage cases for patient", "updated": 0}

    updated_count = 0
    for case in pending_cases:
        # Skip if EEG was already used when this case was admitted
        existing_insight = case.clinical_insight or {}
        if existing_insight.get("_eeg_informed"):
            continue

        # Reconstruct vitals from stored vitals
        vitals_dict = {}
        if case.vitals:
            vitals_dict = {
                "heart_rate": case.vitals.heart_rate,
                "blood_pressure": case.vitals.blood_pressure,
                "spo2": case.vitals.spo2,
                "temperature": case.vitals.temperature,
            }

        symptoms_text = case.symptoms.complaint_text if case.symptoms else ""

        # Re-calculate severity with EEG data
        new_severity, _ = triage_model_service.predict_triage_severity(
            vitals_dict, eeg_prediction=eeg_context["prediction"]
        )

        # Re-generate Gemini insight with EEG context
        new_insight = await gemini_service.generate_triage_insight(
            vitals=vitals_dict,
            symptoms=symptoms_text,
            model_severity=new_severity.value,
            eeg_context=eeg_context
        )

        # Store updated insight with EEG metadata
        new_insight_dict = new_insight.dict() if hasattr(new_insight, 'dict') else new_insight
        if isinstance(new_insight_dict, dict):
            new_insight_dict["_eeg_informed"] = True
            new_insight_dict["_eeg_prediction"] = eeg_context["prediction"]
            new_insight_dict["_eeg_updated_at"] = datetime.datetime.utcnow().isoformat()

        # Update the case
        old_severity = case.severity
        case.severity = new_severity
        case.clinical_insight = new_insight_dict
        case.last_updated = datetime.datetime.utcnow()
        db.commit()

        print(f"[EEG Re-eval] Case {case.id} patient={patient_id}: {old_severity} → {new_severity} (EEG: {eeg_context['prediction']})")
        updated_count += 1

    return {
        "message": f"Re-evaluated {updated_count} triage case(s) with EEG data",
        "updated": updated_count,
        "eeg_prediction": eeg_context["prediction"]
    }


@router.get("/queue", response_model=List[schemas.TriageCaseOut])
async def get_triage_queue(db: Session = Depends(get_db)):
    """
    Returns the live prioritized queue of patients.
    """
    cases = db.query(models.TriageCase).filter(
        models.TriageCase.status == models.CaseStatus.PENDING
    ).order_by(
        models.TriageCase.severity.asc(),
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
            ai_res = db.query(models.AIResult).filter(models.AIResult.study_id == eeg_study.id).first()
            eeg_info = {
                "id": eeg_study.id,
                "file_name": eeg_study.file_name,
                "prediction": ai_res.prediction_label if ai_res else "UNKNOWN",
                "insight": ai_res.gemini_insight if ai_res else None
            }

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

