import os
import uuid
import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from app.db.session import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user, get_optional_user, require_role
from app.models.user import User, UserRole
from app.models.report import Report, ReportImage, ReportStatus, DamageSeverity, RoadType, ReportVote, ReportStatusHistory
from app.models.ai_prediction import AIPrediction
from app.models.priority_score import PriorityScoreRecord
from app.schemas.report import ReportResponse, ReportDetailResponse, ReportUpdate
from app.services.ai_service import ai_service
from app.services.priority_service import priority_service
from app.services.geospatial_service import geospatial_service
from app.services.cloudinary_service import is_cloudinary_configured, upload_image

router = APIRouter()


@router.post("", response_model=ReportDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    road_name: Optional[str] = Form(None),
    landmark: Optional[str] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    road_type: RoadType = Form(RoadType.RESIDENTIAL),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate image extension
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
    file_ext = os.path.splitext(image.filename)[1].lower()
    if file_ext not in allowed_exts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format '{file_ext}'. Allowed formats: JPG, PNG, WEBP."
        )

    # Save original image to disk
    unique_filename = f"{uuid.uuid4().hex}{file_ext}"
    original_path = os.path.join(settings.ORIGINAL_DIR, unique_filename)
    os.makedirs(settings.ORIGINAL_DIR, exist_ok=True)
    
    with open(original_path, "wb") as f:
        content = await image.read()
        f.write(content)

    # Check for duplicate reports within 25 meters
    existing_reports = db.query(Report.id, Report.latitude, Report.longitude).filter(
        Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.REJECTED])
    ).all()
    
    existing_coords = [(r[0], r[1], r[2]) for r in existing_reports]
    is_dup, dup_ids = geospatial_service.check_duplicate(latitude, longitude, existing_coords, threshold_meters=25.0)

    # Run Real AI Road Damage Computer Vision Inference
    try:
        ai_res = ai_service.analyze_road_damage(original_path)
    except Exception as e:
        # Fallback if image is unreadable
        ai_res = {
            "pothole_count": 0,
            "damage_area_ratio": 0.0,
            "average_confidence": 0.0,
            "bounding_boxes": [],
            "visual_severity": "LOW",
            "explanation": f"Image processing note: {str(e)}",
            "annotated_image_url": None,
            "inference_source": "fallback",
            "inference_time_ms": 0.0,
            "model_version": "YOLOv8-CV-2.0"
        }

    # Map visual severity to DamageSeverity enum
    sev_str = ai_res.get("visual_severity", "LOW")
    try:
        severity_enum = DamageSeverity(sev_str)
    except Exception:
        severity_enum = DamageSeverity.LOW

    # Calculate initial priority score
    now = datetime.now(timezone.utc)
    priority_res = priority_service.calculate_priority(
        severity=severity_enum,
        upvotes=0,
        downvotes=0,
        road_type=road_type,
        created_at=now,
        duplicate_count=len(dup_ids)
    )

    # Determine status: verified if potholes confirmed by AI, otherwise pending review
    initial_status = ReportStatus.VERIFIED if ai_res["pothole_count"] > 0 else ReportStatus.PENDING_REVIEW

    # Generate sequential unique report code
    report_count = db.query(Report).count() + 1
    report_code = f"FMR-{now.year}-{report_count:05d}"

    # Create Report entity
    report = Report(
        report_code=report_code,
        user_id=current_user.id,
        title=title,
        description=description,
        road_name=road_name,
        landmark=landmark,
        latitude=latitude,
        longitude=longitude,
        road_type=road_type,
        status=initial_status,
        severity=severity_enum,
        priority_score=priority_res["total_score"],
        upvotes_count=0,
        downvotes_count=0
    )
    db.add(report)
    db.flush()

    # Determine image URLs (upload to Cloudinary if credentials are configured)
    final_original_url = f"/uploads/original/{unique_filename}"
    final_annotated_url = ai_res.get("annotated_image_url")

    if is_cloudinary_configured():
        cloud_orig = upload_image(original_path, folder="fixmyroad/original")
        if cloud_orig:
            final_original_url = cloud_orig
            
        annot_fname = ai_res.get("annotated_filename")
        if annot_fname:
            annot_local_path = os.path.join(settings.ANNOTATED_DIR, annot_fname)
            if os.path.exists(annot_local_path):
                cloud_annot = upload_image(annot_local_path, folder="fixmyroad/annotated")
                if cloud_annot:
                    final_annotated_url = cloud_annot

    # Create ReportImage entity
    report_img = ReportImage(
        report_id=report.id,
        original_url=final_original_url,
        annotated_url=final_annotated_url,
        is_primary=True
    )
    db.add(report_img)

    # Create AIPrediction entity
    ai_pred = AIPrediction(
        report_id=report.id,
        model_name="YOLOv8-RoadDamage",
        model_version=ai_res.get("model_version", "8.0.0"),
        inference_source=ai_res.get("inference_source", "local"),
        pothole_count=ai_res.get("pothole_count", 0),
        total_damage_area_ratio=ai_res.get("damage_area_ratio", 0.0),
        average_confidence=ai_res.get("average_confidence", 0.0),
        bounding_boxes_json=json.dumps(ai_res.get("bounding_boxes", [])),
        visual_severity_label=sev_str,
        explanation_text=ai_res.get("explanation"),
        inference_time_ms=ai_res.get("inference_time_ms", 0.0)
    )
    db.add(ai_pred)

    # Create PriorityScoreRecord entity
    p_rec = PriorityScoreRecord(
        report_id=report.id,
        total_score=priority_res["total_score"],
        severity_component=priority_res["severity_component"],
        community_component=priority_res["community_component"],
        road_importance_component=priority_res["road_importance_component"],
        age_component=priority_res["age_component"],
        location_risk_component=priority_res["location_risk_component"],
        duplicate_component=priority_res["duplicate_component"]
    )
    db.add(p_rec)

    # Create Status History Entry
    history = ReportStatusHistory(
        report_id=report.id,
        previous_status=None,
        new_status=initial_status,
        changed_by_user_id=current_user.id,
        notes="Citizen report submitted with automated AI computer vision analysis."
    )
    db.add(history)

    db.commit()
    db.refresh(report)

    # Construct response
    res_dict = _format_report_detail(report, db, current_user.id)
    return res_dict


@router.get("", response_model=List[ReportResponse])
def get_reports(
    status: Optional[ReportStatus] = None,
    severity: Optional[DamageSeverity] = None,
    road_type: Optional[RoadType] = None,
    search: Optional[str] = None,
    my_reports: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    sort_by: str = Query("priority", pattern="^(priority|created_at|upvotes)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(Report)

    if my_reports:
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required to view personal reports.")
        query = query.filter(Report.user_id == current_user.id)

    if status:
        query = query.filter(Report.status == status)
    if severity:
        query = query.filter(Report.severity == severity)
    if road_type:
        query = query.filter(Report.road_type == road_type)
    if search:
        search_filter = or_(
            Report.title.ilike(f"%{search}%"),
            Report.description.ilike(f"%{search}%"),
            Report.road_name.ilike(f"%{search}%"),
            Report.report_code.ilike(f"%{search}%")
        )
        query = query.filter(search_filter)

    if sort_by == "priority":
        query = query.order_by(desc(Report.priority_score), desc(Report.created_at))
    elif sort_by == "upvotes":
        query = query.order_by(desc(Report.upvotes_count), desc(Report.created_at))
    else:
        query = query.order_by(desc(Report.created_at))

    reports = query.offset(offset).limit(limit).all()

    # Determine user vote status for each report
    user_votes = {}
    if current_user:
        report_ids = [r.id for r in reports]
        votes = db.query(ReportVote).filter(
            ReportVote.report_id.in_(report_ids),
            ReportVote.user_id == current_user.id
        ).all()
        for v in votes:
            user_votes[v.report_id] = v.vote_type.value

    results = []
    for r in reports:
        item = ReportResponse.model_validate(r)
        item.user_vote = user_votes.get(r.id)
        results.append(item)

    return results


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report_by_id(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    user_id = current_user.id if current_user else None
    return _format_report_detail(report, db, user_id)


@router.patch("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    update_data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    if report.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to edit this report.")

    if update_data.title is not None:
        report.title = update_data.title
    if update_data.description is not None:
        report.description = update_data.description
    if update_data.road_name is not None:
        report.road_name = update_data.road_name
    if update_data.landmark is not None:
        report.landmark = update_data.landmark
    if update_data.road_type is not None:
        report.road_type = update_data.road_type

    db.commit()
    db.refresh(report)
    return report


def _format_report_detail(report: Report, db: Session, user_id: Optional[int]) -> dict:
    user_vote = None
    if user_id:
        v = db.query(ReportVote).filter(
            ReportVote.report_id == report.id,
            ReportVote.user_id == user_id
        ).first()
        if v:
            user_vote = v.vote_type.value

    # Parse AI prediction
    ai_dict = None
    if report.ai_prediction:
        p = report.ai_prediction
        boxes = []
        try:
            boxes = json.loads(p.bounding_boxes_json)
        except Exception:
            pass
            
        ai_dict = {
            "pothole_count": p.pothole_count,
            "damage_area_ratio": p.total_damage_area_ratio,
            "average_confidence": p.average_confidence,
            "bounding_boxes": boxes,
            "visual_severity": p.visual_severity_label,
            "explanation": p.explanation_text or "",
            "annotated_image_url": report.images[0].annotated_url if report.images else None,
            "inference_source": p.inference_source,
            "inference_time_ms": p.inference_time_ms,
            "model_version": p.model_version
        }

    # Priority breakdown
    pb_dict = None
    p_rec = db.query(PriorityScoreRecord).filter(PriorityScoreRecord.report_id == report.id).order_by(desc(PriorityScoreRecord.calculated_at)).first()
    if p_rec:
        level = "CRITICAL" if p_rec.total_score >= 75 else "HIGH" if p_rec.total_score >= 55 else "MEDIUM" if p_rec.total_score >= 35 else "LOW"
        pb_dict = {
            "total_score": p_rec.total_score,
            "severity_component": p_rec.severity_component,
            "community_component": p_rec.community_component,
            "road_importance_component": p_rec.road_importance_component,
            "age_component": p_rec.age_component,
            "location_risk_component": p_rec.location_risk_component,
            "duplicate_component": p_rec.duplicate_component,
            "priority_level": level,
            "weights_version": p_rec.weights_version
        }

    return {
        "id": report.id,
        "report_code": report.report_code,
        "user_id": report.user_id,
        "user": report.user,
        "title": report.title,
        "description": report.description,
        "road_name": report.road_name,
        "landmark": report.landmark,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "road_type": report.road_type,
        "status": report.status,
        "severity": report.severity,
        "priority_score": report.priority_score,
        "upvotes_count": report.upvotes_count,
        "downvotes_count": report.downvotes_count,
        "user_vote": user_vote,
        "images": report.images,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
        "ai_prediction": ai_dict,
        "priority_breakdown": pb_dict,
        "admin_notes": report.admin_notes,
        "rejection_reason": report.rejection_reason
    }
