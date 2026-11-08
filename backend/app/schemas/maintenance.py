from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.models.maintenance import AssignmentStatus


class AssignmentCreate(BaseModel):
    report_id: int
    officer_id: int
    target_completion_date: Optional[datetime] = None
    notes: Optional[str] = None


class AssignmentUpdate(BaseModel):
    status: AssignmentStatus
    notes: Optional[str] = None


class RepairCreate(BaseModel):
    repair_notes: str = Field(..., min_length=5)
    materials_used: Optional[str] = None
    cost_estimate: Optional[float] = None


class OfficerBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    first_name: str
    last_name: str
    email: str


class AssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    officer_id: int
    officer: Optional[OfficerBrief]
    status: AssignmentStatus
    target_completion_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime


class RepairRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    report_id: int
    officer_id: Optional[int]
    repair_notes: str
    completion_image_url: Optional[str]
    materials_used: Optional[str]
    cost_estimate: Optional[float]
    completed_at: datetime
