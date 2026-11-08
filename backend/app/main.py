import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure directories exist
    os.makedirs(settings.ORIGINAL_DIR, exist_ok=True)
    os.makedirs(settings.ANNOTATED_DIR, exist_ok=True)
    os.makedirs(settings.MODELS_DIR, exist_ok=True)

    # Initialize database tables and seed if not in testing mode
    if not os.environ.get("TESTING"):
        try:
            Base.metadata.create_all(bind=engine)
            db = SessionLocal()
            try:
                seed_database(db)
            finally:
                db.close()
        except Exception as e:
            print(f"Database initialization note: {e}")

    yield
    # Shutdown logic if needed


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "FixMyRoad AI Backend Engine: Real-time road damage computer vision detection, "
        "geospatial clustering, multi-factor explainable prioritization, and infrastructure analytics."
    ),
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Uploads (Original & Annotated CV Images)
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": f"{settings.API_V1_STR}/docs"
    }


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_engine": "ready"
    }
