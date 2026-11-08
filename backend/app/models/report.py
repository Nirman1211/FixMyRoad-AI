import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base


class ReportStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    AI_PROCESSED = "AI_PROCESSED"
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"


class DamageSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RoadType(str, enum.Enum):
    HIGHWAY = "HIGHWAY"
    PRIMARY = "PRIMARY"
    SECONDARY = "SECONDARY"
    RESIDENTIAL = "RESIDENTIAL"
    ALLEY = "ALLEY"


class VoteType(str, enum.Enum):
    UP = "UP"
    DOWN = "DOWN"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String(50), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    road_name = Column(String(200), nullable=True)
    landmark = Column(String(200), nullable=True)
    
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    road_type = Column(Enum(RoadType), default=RoadType.RESIDENTIAL, nullable=False)
    
    status = Column(Enum(ReportStatus), default=ReportStatus.SUBMITTED, nullable=False, index=True)
    severity = Column(Enum(DamageSeverity), default=DamageSeverity.LOW, nullable=False, index=True)
    priority_score = Column(Float, default=0.0, index=True, nullable=False)
    
    upvotes_count = Column(Integer, default=0, nullable=False)
    downvotes_count = Column(Integer, default=0, nullable=False)
    
    admin_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="reports")
    images = relationship("ReportImage", back_populates="report", cascade="all, delete-orphan")
    ai_prediction = relationship("AIPrediction", back_populates="report", uselist=False, cascade="all, delete-orphan")
    priority_records = relationship("PriorityScoreRecord", back_populates="report", cascade="all, delete-orphan")
    votes = relationship("ReportVote", back_populates="report", cascade="all, delete-orphan")
    comments = relationship("ReportComment", back_populates="report", cascade="all, delete-orphan")
    status_history = relationship("ReportStatusHistory", back_populates="report", cascade="all, delete-orphan")
    assignment = relationship("MaintenanceAssignment", back_populates="report", uselist=False, cascade="all, delete-orphan")
    repair_records = relationship("RepairRecord", back_populates="report", cascade="all, delete-orphan")


class ReportImage(Base):
    __tablename__ = "report_images"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    original_url = Column(String(500), nullable=False)
    annotated_url = Column(String(500), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    is_primary = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="images")


class ReportVote(Base):
    __tablename__ = "report_votes"
    __table_args__ = (
        UniqueConstraint("report_id", "user_id", name="uq_report_user_vote"),
    )

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vote_type = Column(Enum(VoteType), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="votes")
    user = relationship("User", back_populates="votes")


class ReportComment(Base):
    __tablename__ = "report_comments"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="comments")
    user = relationship("User", back_populates="comments")


class ReportStatusHistory(Base):
    __tablename__ = "report_status_history"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(Enum(ReportStatus), nullable=True)
    new_status = Column(Enum(ReportStatus), nullable=False)
    changed_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="status_history")
