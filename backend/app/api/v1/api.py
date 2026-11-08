from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    reports,
    ai,
    votes,
    comments,
    maps,
    admin,
    maintenance,
    analytics,
    bridge
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(reports.router, prefix="/reports", tags=["Road Damage Reports"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI & Computer Vision"])
api_router.include_router(votes.router, prefix="/reports", tags=["Community Votes"])
api_router.include_router(comments.router, prefix="/reports", tags=["Community Comments"])
api_router.include_router(maps.router, prefix="/maps", tags=["Geospatial & Maps"])
api_router.include_router(admin.router, prefix="/admin", tags=["Administration"])
api_router.include_router(maintenance.router, prefix="/maintenance", tags=["Maintenance Officers"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Data Science & Analytics"])
api_router.include_router(bridge.router, prefix="/bridge", tags=["Bridge Health Assessment"])
