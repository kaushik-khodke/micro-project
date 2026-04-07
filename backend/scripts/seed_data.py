import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.db.models import Base, Patient, TriageCase, Vitals, Symptoms, Severity, CaseStatus

# Database connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./neurobridge.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})

def seed_data():
    with Session(engine) as db:
        # Clear existing data
        print("Cleaning up old data...")
        db.query(Symptoms).delete()
        db.query(Vitals).delete()
        db.query(TriageCase).delete()
        db.query(Patient).delete()
        db.commit()

        # Create Patients
        print("Creating patients...")
        p1 = Patient(
            name="Sarah Miller",
            mrn="MRN-7721",
            age=42,
            gender="Female",
            contact_info="sarah.m@example.com"
        )
        p2 = Patient(
            name="Robert Chen",
            mrn="MRN-8842",
            age=65,
            gender="Male",
            contact_info="r.chen@example.com"
        )
        p3 = Patient(
            name="Elena Rodriguez",
            mrn="MRN-1109",
            age=28,
            gender="Female",
            contact_info="elena.r@example.com"
        )
        db.add_all([p1, p2, p3])
        db.commit()
        db.refresh(p1)
        db.refresh(p2)
        db.refresh(p3)

        # Create Triage Cases with Insights
        print("Creating triage cases and vitals...")
        
        # Case 1: Critical (RED)
        c1 = TriageCase(
            patient_id=p1.id,
            severity=Severity.RED,
            status=CaseStatus.PENDING,
            clinical_insight={
                "summary": "Patient presenting with acute respiratory distress and tachycardia. Oxygen saturation is critically low and requires immediate intervention. Risk of rapid decompensation.",
                "risk_level": "CRITICAL",
                "key_findings": ["Hypoxemia", "Severe Tachycardia", "Diaphoresis"],
                "clinical_flags": ["ABG required", "STAT Imaging", "Oxygen support"],
                "recommended_action": "Move to Resuscitation Bay immediately.",
                "confidence_note": "High confidence based on symptom severity.",
                "disclaimer": "AI Insight - Consult medical professional."
            }
        )
        db.add(c1)
        db.commit()
        db.refresh(c1)

        v1 = Vitals(case_id=c1.id, heart_rate=128, blood_pressure="95/60", spo2=88, temperature=101.2)
        s1 = Symptoms(case_id=c1.id, complaint_text="Severe shortness of breath, chest tightness, and blue-ish tint to lips.")
        db.add_all([v1, s1])

        # Case 2: Serious (ORANGE)
        c2 = TriageCase(
            patient_id=p2.id,
            severity=Severity.ORANGE,
            status=CaseStatus.ADMITTED,
            clinical_insight={
                "summary": "Older adult with unstable blood pressure and moderate heart rate elevation. Suspected cardiac event or autonomic dysfunction. Monitor for rhythm changes.",
                "risk_level": "HIGH",
                "key_findings": ["Hypertensive episode", "Palpitations"],
                "clinical_flags": ["12-lead ECG", "Cardiac enzymes"],
                "recommended_action": "Assign to Monitoring Unit, STAT cardiology console.",
                "confidence_note": "Moderate confidence.",
                "disclaimer": "AI Insight."
            }
        )
        db.add(c2)
        db.commit()
        db.refresh(c2)

        v2 = Vitals(case_id=c2.id, heart_rate=92, blood_pressure="165/105", spo2=96, temperature=98.6)
        s2 = Symptoms(case_id=c2.id, complaint_text="Ongoing chest pressure and occasional lightheadedness.")
        db.add_all([v2, s2])

        # Case 3: Stable (GREEN)
        c3 = TriageCase(
            patient_id=p3.id,
            severity=Severity.GREEN,
            status=CaseStatus.TREATED,
            clinical_insight={
                "summary": "Patient is stable. No immediate lift-threatening signs found. Symptoms consistent with minor inflammation or allergic reaction.",
                "risk_level": "LOW",
                "key_findings": ["Stable vitals"],
                "clinical_flags": ["Follow-up with PCP"],
                "recommended_action": "Discharge with education.",
                "confidence_note": "High confidence.",
                "disclaimer": "AI Insight."
            }
        )
        db.add(c3)
        db.commit()
        db.refresh(c3)

        v3 = Vitals(case_id=c3.id, heart_rate=72, blood_pressure="120/80", spo2=99, temperature=99.1)
        s3 = Symptoms(case_id=c3.id, complaint_text="Localized rash and mild swelling on left forearm.")
        db.add_all([v3, s3])

        db.commit()
        print("Successfully seeded clinical data!")

if __name__ == "__main__":
    seed_data()
