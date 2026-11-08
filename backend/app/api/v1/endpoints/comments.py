from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report, ReportComment
from app.schemas.comment import CommentCreate, CommentResponse

router = APIRouter()


@router.get("/{report_id}/comments", response_model=List[CommentResponse])
def get_comments(report_id: int, db: Session = Depends(get_db)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    comments = db.query(ReportComment).filter(
        ReportComment.report_id == report_id
    ).order_by(desc(ReportComment.created_at)).all()

    results = []
    for c in comments:
        name = f"{c.user.first_name} {c.user.last_name}".strip() if c.user else "Citizen"
        results.append({
            "id": c.id,
            "report_id": c.report_id,
            "user_id": c.user_id,
            "user_name": name,
            "comment_text": c.comment_text,
            "created_at": c.created_at
        })
    return results


@router.post("/{report_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    report_id: int,
    comment_data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    comment = ReportComment(
        report_id=report_id,
        user_id=current_user.id,
        comment_text=comment_data.comment_text
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    name = f"{current_user.first_name} {current_user.last_name}".strip()
    return {
        "id": comment.id,
        "report_id": comment.report_id,
        "user_id": comment.user_id,
        "user_name": name,
        "comment_text": comment.comment_text,
        "created_at": comment.created_at
    }
