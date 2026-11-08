from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class BridgePredictionRequest(BaseModel):
    bridge_name: Optional[str] = "Municipal Span"
    age: int = Field(..., ge=0, le=150, description="Bridge age in years")
    material: str = Field(..., description="Concrete, Steel, Wood, or Composite")
    span_length: float = Field(..., ge=1.0, le=5000.0, description="Span length in meters")
    traffic_load: int = Field(..., ge=0, description="Vehicles per day")
    maintenance_level: str = Field(..., description="Low, Medium, or High")
    environmental_conditions: str = Field(..., description="Mild, Normal, or Harsh")
    cracks_detected: str = Field(..., description="'yes' or 'no'")
    corrosion_level: int = Field(..., ge=0, le=10, description="Corrosion rating 0-10")


class BridgePredictionResponse(BaseModel):
    id: Optional[int] = None
    bridge_name: str
    predicted_remaining_life: float
    risk_category: str
    confidence_score: float
    explanation: str
    feature_contributions: Dict[str, Any]
    disclaimer: str
    created_at: Optional[datetime] = None
