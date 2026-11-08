from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.report import Report, ReportStatus, DamageSeverity
from app.services.geospatial_service import geospatial_service
from app.schemas.analytics import HotspotCluster

router = APIRouter()


@router.get("/reports")
def get_map_reports(
    severity: Optional[DamageSeverity] = None,
    status: Optional[ReportStatus] = None,
    include_resolved: bool = Query(False),
    db: Session = Depends(get_db)
):
    query = db.query(Report)

    if not include_resolved:
        query = query.filter(Report.status != ReportStatus.REJECTED)
    if severity:
        query = query.filter(Report.severity == severity)
    if status:
        query = query.filter(Report.status == status)

    reports = query.all()

    map_items = []
    for r in reports:
        thumbnail = r.images[0].original_url if r.images else None
        annotated = r.images[0].annotated_url if r.images else None
        
        map_items.append({
            "id": r.id,
            "report_code": r.report_code,
            "title": r.title,
            "road_name": r.road_name,
            "latitude": r.latitude,
            "longitude": r.longitude,
            "severity": r.severity.value,
            "status": r.status.value,
            "priority_score": r.priority_score,
            "upvotes_count": r.upvotes_count,
            "thumbnail_url": thumbnail,
            "annotated_url": annotated,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return map_items


@router.get("/nearby")
def get_nearby_reports(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(2.0, ge=0.1, le=50.0),
    db: Session = Depends(get_db)
):
    # Fetch active reports
    reports = db.query(Report).filter(
        Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.REJECTED])
    ).all()

    nearby_results = []
    radius_meters = radius_km * 1000.0

    for r in reports:
        dist_m = geospatial_service.haversine_distance(lat, lon, r.latitude, r.longitude)
        if dist_m <= radius_meters:
            thumbnail = r.images[0].original_url if r.images else None
            nearby_results.append({
                "id": r.id,
                "report_code": r.report_code,
                "title": r.title,
                "road_name": r.road_name,
                "latitude": r.latitude,
                "longitude": r.longitude,
                "severity": r.severity.value,
                "status": r.status.value,
                "priority_score": r.priority_score,
                "distance_km": round(dist_m / 1000.0, 2),
                "distance_meters": round(dist_m, 1),
                "thumbnail_url": thumbnail
            })

    # Sort by closest first
    nearby_results.sort(key=lambda x: x["distance_meters"])

    return {
        "user_location": {"latitude": lat, "longitude": lon},
        "radius_km": radius_km,
        "count": len(nearby_results),
        "caution_alert": len(nearby_results) > 0,
        "reports": nearby_results
    }


@router.get("/heatmap")
def get_heatmap_points(db: Session = Depends(get_db)):
    reports = db.query(Report).filter(
        Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.REJECTED])
    ).all()

    points = []
    severity_weights = {
        DamageSeverity.CRITICAL: 1.0,
        DamageSeverity.HIGH: 0.75,
        DamageSeverity.MEDIUM: 0.50,
        DamageSeverity.LOW: 0.25
    }

    for r in reports:
        weight = severity_weights.get(r.severity, 0.4)
        points.append([r.latitude, r.longitude, weight])

    return points


@router.get("/hotspots", response_model=List[HotspotCluster])
def get_damage_hotspots(
    eps_meters: float = Query(200.0, ge=50.0, le=1000.0),
    min_samples: int = Query(2, ge=2, le=10),
    db: Session = Depends(get_db)
):
    active_reports = db.query(Report).filter(
        Report.status.notin_([ReportStatus.RESOLVED, ReportStatus.REJECTED])
    ).all()

    clusters = geospatial_service.cluster_damage_hotspots(
        reports=active_reports,
        eps_meters=eps_meters,
        min_samples=min_samples
    )
    return clusters
