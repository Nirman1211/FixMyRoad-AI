from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.report import DamageSeverity, RoadType
from app.schemas.analytics import OverviewStats, TrendPoint, ResolutionPrediction
from app.services.analytics_service import analytics_service

router = APIRouter()


@router.get("/overview", response_model=OverviewStats)
def get_analytics_overview(db: Session = Depends(get_db)):
    return analytics_service.get_overview_statistics(db)


@router.get("/trends", response_model=List[TrendPoint])
def get_analytics_trends(
    days: int = Query(14, ge=7, le=90),
    db: Session = Depends(get_db)
):
    return analytics_service.get_activity_trends(db, days=days)


@router.post("/predict-resolution", response_model=ResolutionPrediction)
def predict_repair_time(
    severity: DamageSeverity,
    road_type: RoadType,
    backlog: int = Query(5, ge=0, le=500)
):
    return analytics_service.predict_resolution_time(
        severity=severity,
        road_type=road_type,
        pending_backlog=backlog
    )
