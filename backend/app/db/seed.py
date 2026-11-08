import os
import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.report import Report, ReportImage, ReportStatus, DamageSeverity, RoadType
from app.models.ai_prediction import AIPrediction
from app.models.priority_score import PriorityScoreRecord
from app.models.maintenance import MaintenanceAssignment, AssignmentStatus
from app.core.security import get_password_hash
from app.core.config import settings


def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("Seeding FixMyRoad initial database records...")

    # 1. Seed Roles & Users
    admin = User(
        email="admin@fixmyroad.org",
        hashed_password=get_password_hash("Admin@2026"),
        first_name="Chief",
        last_name="Administrator",
        phone="+1-555-0199",
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(admin)

    officer = User(
        email="officer@fixmyroad.org",
        hashed_password=get_password_hash("Officer@2026"),
        first_name="Marcus",
        last_name="Vance",
        phone="+1-555-0142",
        role=UserRole.OFFICER,
        is_active=True
    )
    db.add(officer)

    citizen = User(
        email="citizen@fixmyroad.org",
        hashed_password=get_password_hash("Citizen@2026"),
        first_name="Elena",
        last_name="Rostova",
        phone="+1-555-0188",
        role=UserRole.CITIZEN,
        is_active=True
    )
    db.add(citizen)
    db.commit()
    db.refresh(admin)
    db.refresh(officer)
    db.refresh(citizen)

    # 2. Sample Road Damage Reports
    now = datetime.now(timezone.utc)
    sample_reports = [
        {
            "code": "FMR-2026-00001",
            "title": "Severe crater cluster in outer express lane",
            "description": "Deep asphalt collapse right before junction exit. Vehicles swerving sharply into adjacent traffic.",
            "road": "Interstate Route 95 North",
            "landmark": "Near Exit 24B Mile Marker 88",
            "lat": 40.7128,
            "lon": -74.0060,
            "road_type": RoadType.HIGHWAY,
            "status": ReportStatus.VERIFIED,
            "severity": DamageSeverity.CRITICAL,
            "priority": 88.5,
            "upvotes": 42,
            "downvotes": 1,
            "days_ago": 3,
            "potholes": 4,
            "area_ratio": 0.14
        },
        {
            "code": "FMR-2026-00002",
            "title": "Deep asphalt void outside community high school",
            "description": "Large water-filled pothole directly in pedestrian crossing lane. Bus tires getting caught.",
            "road": "Washington Memorial Boulevard",
            "landmark": "Opposite St. Jude High School",
            "lat": 40.7180,
            "lon": -74.0010,
            "road_type": RoadType.PRIMARY,
            "status": ReportStatus.ASSIGNED,
            "severity": DamageSeverity.HIGH,
            "priority": 76.2,
            "upvotes": 29,
            "downvotes": 0,
            "days_ago": 5,
            "potholes": 2,
            "area_ratio": 0.08
        },
        {
            "code": "FMR-2026-00003",
            "title": "Surface crumbling and edge fracture",
            "description": "Asphalt delamination along bicycle lane shoulder.",
            "road": "Oakwood Avenue",
            "landmark": "Corner of 5th & Oakwood",
            "lat": 40.7250,
            "lon": -74.0120,
            "road_type": RoadType.SECONDARY,
            "status": ReportStatus.IN_PROGRESS,
            "severity": DamageSeverity.MEDIUM,
            "priority": 54.0,
            "upvotes": 14,
            "downvotes": 2,
            "days_ago": 7,
            "potholes": 1,
            "area_ratio": 0.03
        },
        {
            "code": "FMR-2026-00004",
            "title": "Residential cul-de-sac frost heave hole",
            "description": "Winter frost heave crack expanding into a circular depression.",
            "road": "Sycamore Drive",
            "landmark": "House #142",
            "lat": 40.7310,
            "lon": -73.9950,
            "road_type": RoadType.RESIDENTIAL,
            "status": ReportStatus.RESOLVED,
            "severity": DamageSeverity.LOW,
            "priority": 32.5,
            "upvotes": 8,
            "downvotes": 1,
            "days_ago": 12,
            "potholes": 1,
            "area_ratio": 0.01
        },
        {
            "code": "FMR-2026-00005",
            "title": "Hospital emergency route depression",
            "description": "Continuous rutting and surface breakdown slowing ambulances.",
            "road": "Metro Health Parkway",
            "landmark": "City General Hospital West Gate",
            "lat": 40.7145,
            "lon": -74.0042,
            "road_type": RoadType.PRIMARY,
            "status": ReportStatus.VERIFIED,
            "severity": DamageSeverity.CRITICAL,
            "priority": 91.0,
            "upvotes": 65,
            "downvotes": 0,
            "days_ago": 2,
            "potholes": 3,
            "area_ratio": 0.11
        }
    ]

    for item in sample_reports:
        created_time = now - timedelta(days=item["days_ago"])
        rep = Report(
            report_code=item["code"],
            user_id=citizen.id,
            title=item["title"],
            description=item["description"],
            road_name=item["road"],
            landmark=item["landmark"],
            latitude=item["lat"],
            longitude=item["lon"],
            road_type=item["road_type"],
            status=item["status"],
            severity=item["severity"],
            priority_score=item["priority"],
            upvotes_count=item["upvotes"],
            downvotes_count=item["downvotes"],
            created_at=created_time,
            updated_at=created_time
        )
        db.add(rep)
        db.flush()

        # Image
        img = ReportImage(
            report_id=rep.id,
            original_url="/uploads/original/car-and-pothole-01.webp",
            annotated_url=None,
            is_primary=True,
            created_at=created_time
        )
        db.add(img)

        # AI Prediction
        pred = AIPrediction(
            report_id=rep.id,
            model_name="YOLOv8-RoadDamage",
            model_version="8.0.0",
            inference_source="yolov8_local",
            pothole_count=item["potholes"],
            total_damage_area_ratio=item["area_ratio"],
            average_confidence=0.89,
            bounding_boxes_json=json.dumps([
                {"x1": 120, "y1": 180, "x2": 310, "y2": 340, "confidence": 0.91, "class_name": "pothole"}
            ]),
            visual_severity_label=item["severity"].value,
            explanation_text=f"Detected {item['potholes']} damage region(s) with high confidence.",
            inference_time_ms=42.5,
            created_at=created_time
        )
        db.add(pred)

        # Priority breakdown
        p_rec = PriorityScoreRecord(
            report_id=rep.id,
            total_score=item["priority"],
            severity_component=80.0,
            community_component=item["upvotes"] * 1.5,
            road_importance_component=70.0,
            age_component=item["days_ago"] * 5.0,
            location_risk_component=40.0,
            duplicate_component=10.0,
            calculated_at=created_time
        )
        db.add(p_rec)

        # Assignment for assigned / in_progress reports
        if item["status"] in (ReportStatus.ASSIGNED, ReportStatus.IN_PROGRESS):
            assign = MaintenanceAssignment(
                report_id=rep.id,
                officer_id=officer.id,
                assigned_by_id=admin.id,
                status=AssignmentStatus.IN_PROGRESS if item["status"] == ReportStatus.IN_PROGRESS else AssignmentStatus.ASSIGNED,
                target_completion_date=now + timedelta(days=2),
                notes="Priority repair schedule allocated.",
                created_at=created_time
            )
            db.add(assign)

    db.commit()
    print("Database seeding completed successfully.")
