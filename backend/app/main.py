import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routes_patients, routes_triage, routes_eeg
from app.db.session import engine
from app.db.models import Base
from app.core.config import settings

# Ensure upload directories exist
UPLOADS_DIR = "uploads"
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(routes_patients.router, prefix=f"{settings.API_V1_STR}/patients", tags=["Patients"])
app.include_router(routes_triage.router, prefix=f"{settings.API_V1_STR}/triage", tags=["Triage"])
app.include_router(routes_eeg.router, prefix=f"{settings.API_V1_STR}/eeg", tags=["EEG"])

@app.get("/health")
def health_check():
    return {"status": "online", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
