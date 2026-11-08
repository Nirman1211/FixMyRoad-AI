import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.config import settings
from app.core.dependencies import require_role
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus, ReportStatusHistory
from app.models.maintenance import MaintenanceAssignment, RepairRecord, AssignmentStatus
from app.schemas.maintenance import AssignmentResponse, RepairRecordResponse, AssignmentUpdate
from app.services.cloudinary_service import is_cloudinary_configured, upload_image

router = APIRouter()


@router.get("/assigned", response_model=List[AssignmentResponse])
def get_officer_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.OFFICER, UserRole.ADMIN]))
):
    query = db.query(MaintenanceAssignment)
    if current_user.role == UserRole.OFFICER:
        query = query.filter(MaintenanceAssignment.officer_id == current_user.id)

    assignments = query.order_by(desc(MaintenanceAssignment.created_at)).all()
    return assignments


@router.patch("/{assignment_id}/progress", response_model=AssignmentResponse)
def update_progress(
    assignment_id: int,
    progress_data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.OFFICER, UserRole.ADMIN]))
):
    assignment = db.query(MaintenanceAssignment).filter(MaintenanceAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Maintenance assignment not found.")

    if current_user.role == UserRole.OFFICER and assignment.officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own assigned work orders.")

    assignment.status = progress_data.status
    if progress_data.notes:
        assignment.notes = f"{assignment.notes or ''}\n[{current_user.first_name}]: {progress_data.notes}".strip()

    # If status is in progress, also update report status
    if progress_data.status == AssignmentStatus.IN_PROGRESS and assignment.report:
        assignment.report.status = ReportStatus.IN_PROGRESS
        history = ReportStatusHistory(
            report_id=assignment.report_id,
            previous_status=ReportStatus.ASSIGNED,
            new_status=ReportStatus.IN_PROGRESS,
            changed_by_user_id=current_user.id,
            notes=progress_data.notes or "Field repairs commenced by maintenance crew."
        )
        db.add(history)

    db.commit()
    db.refresh(assignment)
    return assignment


@router.post("/{assignment_id}/complete", response_model=RepairRecordResponse)
async def complete_repair(
    assignment_id: int,
    repair_notes: str = Form(...),
    materials_used: Optional[str] = Form(None),
    cost_estimate: Optional[float] = Form(None),
    completion_image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.OFFICER, UserRole.ADMIN]))
):
    assignment = db.query(MaintenanceAssignment).filter(MaintenanceAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Maintenance assignment not found.")

    if current_user.role == UserRole.OFFICER and assignment.officer_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only complete your own assigned work orders.")

    # Save completion photo if uploaded
    completion_img_url = None
    if completion_image:
        allowed_exts = {".jpg", ".jpeg", ".png", ".webp"}
        file_ext = os.path.splitext(completion_image.filename)[1].lower()
        if file_ext in allowed_exts:
            filename = f"resolved_{uuid.uuid4().hex}{file_ext}"
            file_path = os.path.join(settings.ORIGINAL_DIR, filename)
            with open(file_path, "wb") as f:
                content = await completion_image.read()
                f.write(content)
            
            completion_img_url = f"/uploads/original/{filename}"
            if is_cloudinary_configured():
                cloud_url = upload_image(file_path, folder="fixmyroad/maintenance")
                if cloud_url:
                    completion_img_url = cloud_url

    # Create repair record
    repair = RepairRecord(
        assignment_id=assignment.id,
        report_id=assignment.report_id,
        officer_id=current_user.id,
        repair_notes=repair_notes,
        completion_image_url=completion_img_url,
        materials_used=materials_used,
        cost_estimate=cost_estimate
    )
    db.add(repair)

    # Transition assignment to COMPLETED
    assignment.status = AssignmentStatus.COMPLETED

    # Transition report to RESOLVED
    if assignment.report:
        prev_status = assignment.report.status
        assignment.report.status = ReportStatus.RESOLVED

        history = ReportStatusHistory(
            report_id=assignment.report_id,
            previous_status=prev_status,
            new_status=ReportStatus.RESOLVED,
            changed_by_user_id=current_user.id,
            notes=f"Repair completed successfully. Notes: {repair_notes}"
        )
        db.add(history)

    db.commit()
    db.refresh(repair)
    return repair
