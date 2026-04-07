from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Create engine
# check_same_thread=False is only needed for SQLite
engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)

# Enable Foreign Key enforcement for SQLite
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
