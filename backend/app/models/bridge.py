from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base


class BridgeRecord(Base):
    __tablename__ = "bridge_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    bridge_name = Column(String(150), default="Structural Span", nullable=False)
    age = Column(Integer, nullable=False)
    material = Column(String(50), nullable=False)
    span_length = Column(Float, nullable=False)
    traffic_load = Column(Integer, nullable=False)
    maintenance_level = Column(String(50), nullable=False)
    environmental_conditions = Column(String(50), nullable=False)
    cracks_detected = Column(String(10), nullable=False)
    corrosion_level = Column(Integer, nullable=False)
    
    predicted_remaining_life = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False)  # "CRITICAL", "MODERATE", "GOOD"
    model_version = Column(String(50), default="XGBoost-Bridge-v1", nullable=False)
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="bridge_records")
