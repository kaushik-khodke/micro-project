import sys
import os
from pathlib import Path

# Add the parent directory to sys.path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.models import Base, Patient, TriageCase, Severity, CaseStatus


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Patient).count() > 0:
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding database...")

        # Sample Patients
        patients = [
            Patient(name="John Doe", age=45, gender="Male", mrn="MRN-1001", contact_info="555-0101"),
            Patient(name="Jane Smith", age=32, gender="Female", mrn="MRN-1002", contact_info="555-0102"),
            Patient(name="Robert Johnson", age=68, gender="Male", mrn="MRN-1003", contact_info="555-0103"),
            Patient(name="Emily Davis", age=24, gender="Female", mrn="MRN-1004", contact_info="555-0104"),
            Patient(name="Michael Brown", age=52, gender="Male", mrn="MRN-1005", contact_info="555-0105"),
        ]

        for p in patients:
            db.add(p)
        db.commit()

        # Refresh to get IDs
        for p in patients:
            db.refresh(p)

        # Sample Triage Records
        triage_records = [
            TriageCase(
                patient_id=patients[0].id,
                severity=Severity.RED,
                status=CaseStatus.PENDING
            ),
            TriageCase(
                patient_id=patients[1].id,
                severity=Severity.ORANGE,
                status=CaseStatus.ADMITTED
            ),
            TriageCase(
                patient_id=patients[2].id,
                severity=Severity.GREEN,
                status=CaseStatus.TREATED
            )
        ]

        for tr in triage_records:
            db.add(tr)
        db.commit()

        print(f"Successfully seeded {len(patients)} patients and {len(triage_records)} triage records.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
