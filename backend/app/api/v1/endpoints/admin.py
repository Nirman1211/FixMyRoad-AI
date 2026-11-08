from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.dependencies import require_role
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus, DamageSeverity, ReportStatusHistory
from app.models.maintenance import MaintenanceAssignment, AssignmentStatus
from app.schemas.report import ReportStatusUpdate, ReportResponse
from app.schemas.maintenance import AssignmentCreate, AssignmentResponse
from app.schemas.auth import UserResponse
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN]))
):
    stats = analytics_service.get_overview_statistics(db)
    recent_reports = db.query(Report).order_by(desc(Report.created_at)).limit(10).all()

    return {
        "statistics": stats,
        "recent_reports": [ReportResponse.model_validate(r) for r in recent_reports]
    }


@router.get("/officers", response_model=List[UserResponse])
def list_officers(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN]))
):
    officers = db.query(User).filter(User.role == UserRole.OFFICER, User.is_active == True).all()
    return officers


@router.patch("/reports/{report_id}/status", response_model=ReportResponse)
def update_report_status(
    report_id: int,
    status_data: ReportStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    prev_status = report.status
    report.status = status_data.status
    
    if status_data.notes:
        report.admin_notes = status_data.notes
    if status_data.rejection_reason:
        report.rejection_reason = status_data.rejection_reason

    # Add audit status history record
    history = ReportStatusHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status=status_data.status,
        changed_by_user_id=admin_user.id,
        notes=status_data.notes or status_data.rejection_reason or f"Status transitioned to {status_data.status.value}"
    )
    db.add(history)
    db.commit()
    db.refresh(report)
    return report


@router.post("/reports/{report_id}/assign", response_model=AssignmentResponse)
def assign_report_to_officer(
    report_id: int,
    assign_data: AssignmentCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN]))
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    officer = db.query(User).filter(User.id == assign_data.officer_id, User.role == UserRole.OFFICER).first()
    if not officer:
        raise HTTPException(status_code=400, detail="Target user is not a valid maintenance officer.")

    # Check if assignment already exists
    existing = db.query(MaintenanceAssignment).filter(MaintenanceAssignment.report_id == report_id).first()
    if existing:
        existing.officer_id = officer.id
        existing.status = AssignmentStatus.ASSIGNED
        existing.target_completion_date = assign_data.target_completion_date
        existing.notes = assign_data.notes
        assignment = existing
    else:
        assignment = MaintenanceAssignment(
            report_id=report.id,
            officer_id=officer.id,
            assigned_by_id=admin_user.id,
            status=AssignmentStatus.ASSIGNED,
            target_completion_date=assign_data.target_completion_date,
            notes=assign_data.notes
        )
        db.add(assignment)

    # Transition report status to ASSIGNED
    prev_status = report.status
    report.status = ReportStatus.ASSIGNED

    history = ReportStatusHistory(
        report_id=report.id,
        previous_status=prev_status,
        new_status=ReportStatus.ASSIGNED,
        changed_by_user_id=admin_user.id,
        notes=f"Assigned to Maintenance Officer {officer.first_name} {officer.last_name}"
    )
    db.add(history)

    db.commit()
    db.refresh(assignment)
    return assignment
