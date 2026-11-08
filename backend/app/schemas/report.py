from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.report import ReportStatus, DamageSeverity, RoadType, VoteType
from app.schemas.ai import AIDetectionResponse
from app.schemas.priority import PriorityBreakdown


class ReportImageSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    original_url: str
    annotated_url: Optional[str] = None
    is_primary: bool
    created_at: datetime


class ReportCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = None
    road_name: Optional[str] = None
    landmark: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    road_type: RoadType = RoadType.RESIDENTIAL


class ReportUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    road_name: Optional[str] = None
    landmark: Optional[str] = None
    road_type: Optional[RoadType] = None


class ReportStatusUpdate(BaseModel):
    status: ReportStatus
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class UserBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str


class ReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_code: str
    user_id: Optional[int]
    user: Optional[UserBrief] = None
    title: str
    description: Optional[str]
    road_name: Optional[str]
    landmark: Optional[str]
    latitude: float
    longitude: float
    road_type: RoadType
    status: ReportStatus
    severity: DamageSeverity
    priority_score: float
    upvotes_count: int
    downvotes_count: int
    user_vote: Optional[str] = None
    images: List[ReportImageSchema] = []
    created_at: datetime
    updated_at: Optional[datetime]


class ReportDetailResponse(ReportResponse):
    ai_prediction: Optional[AIDetectionResponse] = None
    priority_breakdown: Optional[PriorityBreakdown] = None
    admin_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
