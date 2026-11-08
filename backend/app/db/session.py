from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.db.base import Base

# Fix Render / Heroku PostgreSQL connection string (SQLAlchemy 2.0 requires postgresql://)
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

connect_args = {}
if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
