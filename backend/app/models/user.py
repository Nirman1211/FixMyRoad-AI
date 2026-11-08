import enum
from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.db.base import Base


class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False, default="")
    phone = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.CITIZEN, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    votes = relationship("ReportVote", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("ReportComment", back_populates="user", cascade="all, delete-orphan")
    assignments = relationship("MaintenanceAssignment", foreign_keys="MaintenanceAssignment.officer_id", back_populates="officer")
    bridge_records = relationship("BridgeRecord", back_populates="user")
