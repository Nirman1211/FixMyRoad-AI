from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class PriorityScoreRecord(Base):
    __tablename__ = "priority_scores"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    
    total_score = Column(Float, nullable=False, index=True)
    severity_component = Column(Float, default=0.0, nullable=False)
    community_component = Column(Float, default=0.0, nullable=False)
    road_importance_component = Column(Float, default=0.0, nullable=False)
    age_component = Column(Float, default=0.0, nullable=False)
    location_risk_component = Column(Float, default=0.0, nullable=False)
    duplicate_component = Column(Float, default=0.0, nullable=False)
    
    weights_version = Column(String(50), default="1.0.0", nullable=False)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="priority_records")
