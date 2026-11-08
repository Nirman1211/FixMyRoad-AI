from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class AIPrediction(Base):
    __tablename__ = "ai_predictions"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    model_name = Column(String(100), default="YOLOv8-RoadDamage", nullable=False)
    model_version = Column(String(50), default="8.0.0", nullable=False)
    inference_source = Column(String(50), default="local", nullable=False)  # "local" or "roboflow"
    
    pothole_count = Column(Integer, default=0, nullable=False)
    total_damage_area_ratio = Column(Float, default=0.0, nullable=False)
    average_confidence = Column(Float, default=0.0, nullable=False)
    
    bounding_boxes_json = Column(Text, nullable=False, default="[]")  # JSON serialized list of boxes
    visual_severity_label = Column(String(50), default="LOW", nullable=False)
    explanation_text = Column(Text, nullable=True)
    
    inference_time_ms = Column(Float, default=0.0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    report = relationship("Report", back_populates="ai_prediction")
