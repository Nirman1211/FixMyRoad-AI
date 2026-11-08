import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "FixMyRoad AI"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security & Tokens
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fixmyroad-production-insecure-default-change-me-09f91102")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours for seamless development
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./fixmyroad.db")
    
    # Cloudinary Image Storage (Optional - fallback to local storage if not configured)
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # Computer Vision & Inference Configuration
    ROBOFLOW_API_KEY: str = os.getenv("ROBOFLOW_API_KEY", "")
    ROBOFLOW_PROJECT: str = os.getenv("ROBOFLOW_PROJECT", "pothole-detection-i00zy")
    ROBOFLOW_VERSION: int = int(os.getenv("ROBOFLOW_VERSION", "2"))
    
    USE_LOCAL_YOLO: bool = os.getenv("USE_LOCAL_YOLO", "true").lower() in ("true", "1", "yes")
    YOLO_MODEL_PATH: str = os.getenv("YOLO_MODEL_PATH", "models/yolov8n.pt")
    CONFIDENCE_THRESHOLD: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.40"))
    
    # Upload Directories
    BASE_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    UPLOAD_DIR: str = os.path.join(BASE_DIR, "uploads")
    ORIGINAL_DIR: str = os.path.join(UPLOAD_DIR, "original")
    ANNOTATED_DIR: str = os.path.join(UPLOAD_DIR, "annotated")
    MODELS_DIR: str = os.path.join(BASE_DIR, "models")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]


settings = Settings()
