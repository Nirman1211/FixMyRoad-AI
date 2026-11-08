from typing import List, Dict, Any, Optional
from pydantic import BaseModel


class OverviewStats(BaseModel):
    total_reports: int
    pending_reports: int
    verified_reports: int
    assigned_reports: int
    in_progress_reports: int
    resolved_reports: int
    rejected_reports: int
    critical_reports: int
    total_citizens: int
    total_officers: int
    average_resolution_days: float


class TrendPoint(BaseModel):
    date: str
    submitted_count: int
    resolved_count: int


class HotspotCluster(BaseModel):
    cluster_id: int
    center_latitude: float
    center_longitude: float
    report_count: int
    highest_severity: str
    average_priority: float
    sample_reports: List[int]
    corridor_name: Optional[str] = None


class ResolutionPrediction(BaseModel):
    predicted_days: float
    confidence_interval_days: List[float]
    primary_influencing_factors: List[str]
    workload_multiplier: float
