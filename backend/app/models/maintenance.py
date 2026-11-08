import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MaintenanceAssignment(Base):
    __tablename__ = "maintenance_assignments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.ASSIGNED, nullable=False)
    target_completion_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    report = relationship("Report", back_populates="assignment")
    officer = relationship("User", foreign_keys=[officer_id], back_populates="assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])
    repair_record = relationship("RepairRecord", back_populates="assignment", uselist=False, cascade="all, delete-orphan")


class RepairRecord(Base):
    __tablename__ = "repair_records"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("maintenance_assignments.id", ondelete="CASCADE"), unique=True, nullable=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    officer_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    repair_notes = Column(Text, nullable=False)
    completion_image_url = Column(String(500), nullable=True)
    materials_used = Column(String(255), nullable=True)
    cost_estimate = Column(Float, nullable=True)
    
    completed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    assignment = relationship("MaintenanceAssignment", back_populates="repair_record")
    report = relationship("Report", back_populates="repair_records")
    officer = relationship("User")
