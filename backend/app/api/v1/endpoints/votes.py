from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report, ReportVote, VoteType
from app.models.priority_score import PriorityScoreRecord
from app.schemas.vote import VoteRequest, VoteResponse
from app.services.priority_service import priority_service

router = APIRouter()


@router.post("/{report_id}/votes", response_model=VoteResponse)
def vote_on_report(
    report_id: int,
    vote_data: VoteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    # Prevent voting on own report
    if report.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot vote on your own submitted report."
        )

    existing_vote = db.query(ReportVote).filter(
        ReportVote.report_id == report_id,
        ReportVote.user_id == current_user.id
    ).first()

    if existing_vote:
        if existing_vote.vote_type == vote_data.vote_type:
            # Toggling off existing vote
            db.delete(existing_vote)
            if vote_data.vote_type == VoteType.UP:
                report.upvotes_count = max(0, report.upvotes_count - 1)
            else:
                report.downvotes_count = max(0, report.downvotes_count - 1)
            user_vote_res = None
        else:
            # Switching vote type
            if vote_data.vote_type == VoteType.UP:
                report.upvotes_count += 1
                report.downvotes_count = max(0, report.downvotes_count - 1)
            else:
                report.downvotes_count += 1
                report.upvotes_count = max(0, report.upvotes_count - 1)
            existing_vote.vote_type = vote_data.vote_type
            user_vote_res = vote_data.vote_type.value
    else:
        # New vote
        new_vote = ReportVote(
            report_id=report_id,
            user_id=current_user.id,
            vote_type=vote_data.vote_type
        )
        db.add(new_vote)
        if vote_data.vote_type == VoteType.UP:
            report.upvotes_count += 1
        else:
            report.downvotes_count += 1
        user_vote_res = vote_data.vote_type.value

    # Recalculate priority score with updated community votes
    priority_calc = priority_service.calculate_priority(
        severity=report.severity,
        upvotes=report.upvotes_count,
        downvotes=report.downvotes_count,
        road_type=report.road_type,
        created_at=report.created_at
    )
    report.priority_score = priority_calc["total_score"]

    # Log updated priority record
    p_rec = PriorityScoreRecord(
        report_id=report.id,
        total_score=priority_calc["total_score"],
        severity_component=priority_calc["severity_component"],
        community_component=priority_calc["community_component"],
        road_importance_component=priority_calc["road_importance_component"],
        age_component=priority_calc["age_component"],
        location_risk_component=priority_calc["location_risk_component"],
        duplicate_component=priority_calc["duplicate_component"]
    )
    db.add(p_rec)

    db.commit()
    db.refresh(report)

    return {
        "report_id": report.id,
        "upvotes_count": report.upvotes_count,
        "downvotes_count": report.downvotes_count,
        "user_vote": user_vote_res,
        "new_priority_score": report.priority_score
    }


@router.delete("/{report_id}/votes", response_model=VoteResponse)
def remove_vote(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")

    existing_vote = db.query(ReportVote).filter(
        ReportVote.report_id == report_id,
        ReportVote.user_id == current_user.id
    ).first()

    if existing_vote:
        if existing_vote.vote_type == VoteType.UP:
            report.upvotes_count = max(0, report.upvotes_count - 1)
        else:
            report.downvotes_count = max(0, report.downvotes_count - 1)
        db.delete(existing_vote)

        # Recalculate priority
        p_calc = priority_service.calculate_priority(
            severity=report.severity,
            upvotes=report.upvotes_count,
            downvotes=report.downvotes_count,
            road_type=report.road_type,
            created_at=report.created_at
        )
        report.priority_score = p_calc["total_score"]
        db.commit()

    return {
        "report_id": report.id,
        "upvotes_count": report.upvotes_count,
        "downvotes_count": report.downvotes_count,
        "user_vote": None,
        "new_priority_score": report.priority_score
    }
