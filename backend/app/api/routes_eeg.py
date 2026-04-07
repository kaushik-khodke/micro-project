import shutil
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import models
from app.services.eeg_preprocess_service import eeg_service
from app.services.random_forest_service import triage_model_service
from app.services.gemini_insight_service import gemini_service
from app.core.config import settings

router = APIRouter()

# Supported file extensions
SUPPORTED_EXTENSIONS = {".edf", ".pdf", ".png", ".jpg", ".jpeg"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}

@router.post("/upload")
async def upload_eeg(
    background_tasks: BackgroundTasks,
    patient_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Uploads an EEG file (EDF, PDF, or Image) and initiates background processing.
    Images of EEG graphs are analyzed using Gemini Vision AI.
    """
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type '{file_ext}'. Supported: EDF, PDF, PNG, JPG, JPEG"
        )

    # Determine file type category
    if file_ext == ".edf":
        file_type = "EDF"
        sub_dir = "edf"
    elif file_ext == ".pdf":
        file_type = "PDF"
        sub_dir = "pdf"
    else:
        file_type = "IMAGE"
        sub_dir = "images"

    # 1. Store the file locally
    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.UPLOADS_DIR, sub_dir, f"{file_id}{file_ext}")
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    
    with open(save_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 2. Register Study in DB
    new_study = models.EEGStudy(
        patient_id=patient_id,
        file_path=save_path,
        file_name=file.filename,
        file_type=file_type,
        status="PROCESSING"
    )
    db.add(new_study)
    db.commit()
    db.refresh(new_study)

    # 3. Queue processing in background
    background_tasks.add_task(process_eeg_task, new_study.id)

    return {"message": "File uploaded successfully. Processing started.", "study_id": new_study.id}

async def process_eeg_task(study_id: int):
    """
    Background Task: Process EEG based on file type.
    - EDF: Extract features → Random Forest → Gemini text insight
    - PDF: Random Forest (generic) → Gemini text insight
    - IMAGE: Gemini Vision → visual EEG graph interpretation (unique confidence per image)
    """
    from app.db.session import SessionLocal
    db = SessionLocal()
    
    try:
        study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
        if not study: return

        if study.file_type == "IMAGE":
            # === IMAGE PATH: Use Gemini Vision for visual EEG analysis ===
            insight = await gemini_service.generate_eeg_image_insight(study.file_path)
            
            # Extract prediction and confidence from the vision response
            label = insight.get("prediction_label", "BORDERLINE")
            score = insight.get("confidence_score", 0.65)
            
            ai_result = models.AIResult(
                study_id=study.id,
                model_score=score,
                prediction_label=label,
                confidence=score,
                gemini_insight=insight
            )
        else:
            # === EDF/PDF PATH: Feature extraction → Random Forest → Gemini text insight ===
            features = {}
            if study.file_type == "EDF":
                features = eeg_service.extract_features(study.file_path)
            
            label, score = triage_model_service.predict_eeg_abnormality(features)
            
            insight = await gemini_service.generate_eeg_insight(
                features=features,
                findings="Analysis of uploaded signal for abnormality."
            )
            
            ai_result = models.AIResult(
                study_id=study.id,
                model_score=score,
                prediction_label=label,
                gemini_insight=insight
            )

        db.add(ai_result)
        study.status = "COMPLETED"
        db.commit()

    except Exception as e:
        print(f"Background Job Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
        if study:
            study.status = "FAILED"
            db.commit()
    finally:
        db.close()

@router.get("/{study_id}/analysis")
async def get_eeg_analysis(study_id: int, db: Session = Depends(get_db)):
    """
    Returns the results of an EEG study.
    """
    study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    return {
        "status": study.status,
        "details": study.ai_result if study.status == "COMPLETED" else None,
        "file_type": study.file_type,
        "file_name": study.file_name
    }

@router.get("/{study_id}/download")
async def download_original_file(study_id: int, db: Session = Depends(get_db)):
    """
    Downloads the original file (EDF, PDF, or Image) uploaded for the study.
    """
    from fastapi.responses import FileResponse
    
    study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    if not os.path.exists(study.file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
    
    media_types = {
        "PDF": "application/pdf",
        "IMAGE": "image/png",
        "EDF": "application/octet-stream"
    }
        
    return FileResponse(
        path=study.file_path,
        filename=study.file_name,
        media_type=media_types.get(study.file_type, "application/octet-stream")
    )
