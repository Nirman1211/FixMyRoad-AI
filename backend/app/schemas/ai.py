from typing import List, Optional
from pydantic import BaseModel


class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    class_name: str = "pothole"


class AIDetectionResponse(BaseModel):
    pothole_count: int
    damage_area_ratio: float
    average_confidence: float
    bounding_boxes: List[BoundingBox]
    visual_severity: str
    explanation: str
    annotated_image_url: Optional[str] = None
    inference_source: str
    inference_time_ms: float
    model_version: str


class ModelInfoResponse(BaseModel):
    model_name: str
    version: str
    engine: str
    weights_path: str
    fallback_available: bool
    status: str
