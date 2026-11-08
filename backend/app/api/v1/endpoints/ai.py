import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.core.config import settings
from app.services.ai_service import ai_service
from app.schemas.ai import AIDetectionResponse, ModelInfoResponse

router = APIRouter()


@router.post("/detect", response_model=AIDetectionResponse)
async def detect_road_damage(image: UploadFile = File(...)):
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(image.filename)[1].lower()
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file extension {file_ext}."
        )

    unique_filename = f"temp_{uuid.uuid4().hex}{file_ext}"
    temp_path = os.path.join(settings.ORIGINAL_DIR, unique_filename)
    os.makedirs(settings.ORIGINAL_DIR, exist_ok=True)

    with open(temp_path, "wb") as f:
        content = await image.read()
        f.write(content)

    try:
        result = ai_service.analyze_road_damage(temp_path)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )


@router.get("/model-info", response_model=ModelInfoResponse)
def get_model_info():
    has_gpu = False
    try:
        import torch
        has_gpu = torch.cuda.is_available()
    except Exception:
        pass

    engine_str = "PyTorch CUDA (GPU)" if has_gpu else "PyTorch (CPU)"
    status_str = "Active (Dual Engine: Local YOLOv8 + Roboflow Fallback)"

    return {
        "model_name": "YOLOv8-RoadDamage",
        "version": "2.0.0",
        "engine": engine_str,
        "weights_path": settings.YOLO_MODEL_PATH,
        "fallback_available": bool(settings.ROBOFLOW_API_KEY),
        "status": status_str
    }
