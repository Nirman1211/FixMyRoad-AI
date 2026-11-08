from pydantic import BaseModel


class PriorityBreakdown(BaseModel):
    total_score: float
    severity_component: float
    community_component: float
    road_importance_component: float
    age_component: float
    location_risk_component: float
    duplicate_component: float
    priority_level: str  # "CRITICAL", "HIGH", "MEDIUM", "LOW"
    weights_version: str = "1.0.0"
