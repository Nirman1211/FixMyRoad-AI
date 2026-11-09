import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

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
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Mount Compiled Frontend Assets (JS/CSS for Single-URL Unified Deployment)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
INDEX_FILE = os.path.join(STATIC_DIR, "index.html")

if os.path.exists(ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=ASSETS_DIR), name="assets")


# Include API v1 Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", status_code=status.HTTP_200_OK, tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "ai_engine": "ready"
    }


# Serve React Single-Page Application (SPA) on Root & Client Routes
@app.get("/{full_path:path}", tags=["Frontend"])
async def serve_spa(full_path: str = ""):
    # Do not catch API or upload routes
    if full_path.startswith("api/") or full_path.startswith("uploads/"):
        return JSONResponse(status_code=404, content={"detail": "Not found"})
    
    if os.path.exists(INDEX_FILE):
        return FileResponse(INDEX_FILE)
    
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": f"{settings.API_V1_STR}/docs"
    }
