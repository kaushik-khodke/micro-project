import shutil
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import models
from app.services.eeg_preprocess_service import eeg_service
from app.services.random_forest_service import triage_model_service
from app.services.gemini_insight_service import gemini_service
from app.services.eeg_csv_service import eeg_csv_service
from app.services.eeg_report_service import eeg_report_service
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
    - EDF: Extract features → Random Forest → Gemini text insight, Generate CSV & Full Report
    - PDF: Extract images from PDF pages → Gemini Vision analysis → Generate Full Report
    - IMAGE: Gemini Vision → visual EEG graph interpretation → Generate Full Report
    """
    from app.db.session import SessionLocal
    db = SessionLocal()
    
    try:
        study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
        if not study: return

        features = None
        
        if study.file_type == "IMAGE":
            # === IMAGE PATH: Use Gemini Vision for visual EEG analysis ===
            insight = await gemini_service.generate_eeg_image_insight(study.file_path)
            
            label = insight.get("prediction_label", "BORDERLINE")
            score = insight.get("confidence_score", 0.65)
            
            ai_result = models.AIResult(
                study_id=study.id,
                model_score=score,
                prediction_label=label,
                confidence=score,
                gemini_insight=insight
            )

        elif study.file_type == "PDF":
            # === PDF PATH: Extract images from PDF → Gemini Vision analysis ===
            pdf_image_path = await _extract_image_from_pdf(study.file_path)
            
            if pdf_image_path:
                # Use Gemini Vision on the extracted PDF page image
                insight = await gemini_service.generate_eeg_image_insight(pdf_image_path)
                
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
                # Fallback: send the PDF path directly to Gemini Vision (it can read PDFs natively)
                insight = await gemini_service.generate_eeg_pdf_insight(study.file_path)
                
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
            # === EDF PATH: Feature extraction → Random Forest → Gemini text insight ===
            if study.file_type == "EDF":
                # Convert EDF to CSV
                csv_path = eeg_csv_service.convert_edf_to_csv(study.file_path, study.id)
                if csv_path:
                     study.csv_path = csv_path
                features = eeg_service.extract_features(study.file_path)
            
            label, score = triage_model_service.predict_eeg_abnormality(features if features else {})
            
            insight = await gemini_service.generate_eeg_insight(
                features=features if features else {},
                findings="Analysis of uploaded signal for abnormality."
            )
            # Standardize insight structure slightly for report gen to be similar to image response
            if "prediction_label" not in insight: insight["prediction_label"] = label
            if "confidence_score" not in insight: insight["confidence_score"] = score
            
            ai_result = models.AIResult(
                study_id=study.id,
                model_score=score,
                prediction_label=label,
                gemini_insight=insight,
                confidence=score
            )
            
        # Generate the full structured report data
        report_data = eeg_report_service.generate_full_report(study.id, study.file_path, study.file_type, insight, features)
        study.report_data = report_data
        
        if report_data and "signal_analysis" in report_data:
             ai_result.signal_analysis = report_data["signal_analysis"]

        db.add(ai_result)
        study.status = "COMPLETED"
        db.commit()

        # Generate PDF report in background so it's ready
        try:
             eeg_report_service.generate_pdf_report(study.id, study.file_name, report_data)
        except Exception as pdf_err:
             print(f"Failed to pre-generate PDF: {pdf_err}")

        # === After EEG completes: auto re-evaluate any pending triage cases for this patient ===
        try:
            import httpx
            patient_id = study.patient_id
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"http://127.0.0.1:8000/api/v1/triage/reevaluate/{patient_id}",
                    timeout=60.0
                )
            print(f"[EEG Complete] Triggered triage re-evaluation for patient {patient_id}")
        except Exception as re_eval_err:
            # Non-fatal: log but don't fail the EEG processing
            print(f"[EEG Complete] Triage re-evaluation skipped: {re_eval_err}")

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


async def _extract_image_from_pdf(pdf_path: str) -> str:
    """
    Extracts the best image from a PDF for EEG visual analysis.
    First tries to extract embedded images; falls back to rendering the first page as an image.
    Returns the path to the extracted image, or empty string on failure.
    """
    import fitz  # PyMuPDF
    
    try:
        doc = fitz.open(pdf_path)
        output_dir = os.path.dirname(pdf_path)
        base_name = os.path.splitext(os.path.basename(pdf_path))[0]
        
        # Strategy 1: Try to extract embedded images from the PDF
        best_image_path = ""
        best_image_size = 0
        
        for page_num in range(min(len(doc), 5)):  # Check first 5 pages
            page = doc[page_num]
            image_list = page.get_images(full=True)
            
            for img_idx, img_info in enumerate(image_list):
                xref = img_info[0]
                base_image = doc.extract_image(xref)
                if base_image:
                    image_bytes = base_image["image"]
                    image_size = len(image_bytes)
                    
                    # Keep the largest image (most likely the EEG trace)
                    if image_size > best_image_size and image_size > 10000:  # Min 10KB
                        img_ext = base_image.get("ext", "png")
                        img_path = os.path.join(output_dir, f"{base_name}_extracted_p{page_num}_{img_idx}.{img_ext}")
                        with open(img_path, "wb") as f:
                            f.write(image_bytes)
                        best_image_path = img_path
                        best_image_size = image_size
        
        if best_image_path:
            doc.close()
            return best_image_path
        
        # Strategy 2: Render the most content-rich page as a high-res image
        best_page = 0
        best_text_len = 0
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text_len = len(page.get_text())
            # Pick the page with the most visual content (EEG pages usually have some labels)
            if text_len > best_text_len:
                best_text_len = text_len
                best_page = page_num
        
        # If all pages are similar (image-heavy PDFs), use the first page with visual content
        # Typically page 0 or 1 for EEG reports
        if len(doc) > 1 and best_text_len < 50:
            best_page = min(1, len(doc) - 1)  # Try page 2 (index 1) for EEG reports
        
        page = doc[best_page]
        # Render at 3x resolution for clear EEG traces
        mat = fitz.Matrix(3.0, 3.0)
        pix = page.get_pixmap(matrix=mat)
        
        rendered_path = os.path.join(output_dir, f"{base_name}_rendered_p{best_page}.png")
        pix.save(rendered_path)
        
        doc.close()
        return rendered_path
        
    except Exception as e:
        print(f"PDF image extraction failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return ""

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

@router.get("/{study_id}/report")
async def get_eeg_report(study_id: int, db: Session = Depends(get_db)):
    """
    Returns the full structured report data for an EEG study.
    """
    study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    if study.status != "COMPLETED":
        raise HTTPException(status_code=400, detail="Study is not completed")
        
    if not study.report_data:
         raise HTTPException(status_code=404, detail="Report data not found for this study")
         
    return study.report_data

@router.get("/{study_id}/download/csv")
async def download_csv_file(study_id: int, db: Session = Depends(get_db)):
    """
    Downloads the converted CSV file.
    """
    study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    if not study.csv_path or not os.path.exists(study.csv_path):
        raise HTTPException(status_code=404, detail="CSV file not found or not yet generated")
        
    filename = f"{os.path.splitext(study.file_name)[0]}.csv"
    return FileResponse(
        path=study.csv_path,
        filename=filename,
        media_type="text/csv"
    )

@router.get("/{study_id}/download/edf")
async def download_edf_file(study_id: int, db: Session = Depends(get_db)):
    """
    Downloads the EDF file.
    """
    study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    if study.file_type != "EDF" or not os.path.exists(study.file_path):
        raise HTTPException(status_code=404, detail="EDF file not available for this study")
        
    return FileResponse(
        path=study.file_path,
        filename=study.file_name,
        media_type="application/octet-stream"
    )

@router.get("/{study_id}/download/report-pdf")
async def download_report_pdf(study_id: int, db: Session = Depends(get_db)):
    """
    Downloads the professionally formatted PDF report.
    """
    study = db.query(models.EEGStudy).filter(models.EEGStudy.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
        
    if study.status != "COMPLETED" or not study.report_data:
        raise HTTPException(status_code=400, detail="Report not generated yet")
        
    # Check if pre-generated, if not try to generate
    report_dir = os.path.join(settings.UPLOADS_DIR, "reports")
    pdf_path = os.path.join(report_dir, f"EEG_FullReport_{study_id}.pdf")
    
    if not os.path.exists(pdf_path):
        pdf_path = eeg_report_service.generate_pdf_report(study.id, study.file_name, study.report_data)
        if not pdf_path or not os.path.exists(pdf_path):
             raise HTTPException(status_code=500, detail="Failed to generate PDF report")
             
    filename = f"EEG_Report_{os.path.splitext(study.file_name)[0]}.pdf"
    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf"
    )

@router.get("/{study_id}/download")
async def download_original_file(study_id: int, db: Session = Depends(get_db)):
    """
    Downloads the original file (EDF, PDF, or Image) uploaded for the study.
    """
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
