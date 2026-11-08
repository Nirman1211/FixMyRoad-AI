from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.core.dependencies import get_optional_user
from app.models.user import User
from app.models.bridge import BridgeRecord
from app.schemas.bridge import BridgePredictionRequest, BridgePredictionResponse
from app.services.bridge_service import bridge_service

router = APIRouter()


@router.post("/predict", response_model=BridgePredictionResponse)
def predict_bridge_health(
    request: BridgePredictionRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    try:
        prediction = bridge_service.predict_remaining_life(
            age=request.age,
            material=request.material,
            span_length=request.span_length,
            traffic_load=request.traffic_load,
            maintenance_level=request.maintenance_level,
            environmental_conditions=request.environmental_conditions,
            cracks_detected=request.cracks_detected,
            corrosion_level=request.corrosion_level,
            bridge_name=request.bridge_name or "Municipal Span"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bridge prediction failed: {str(e)}"
        )

    # Persist prediction record in database
    user_id = current_user.id if current_user else None
    record = BridgeRecord(
        user_id=user_id,
        bridge_name=prediction["bridge_name"],
        age=request.age,
        material=request.material,
        span_length=request.span_length,
        traffic_load=request.traffic_load,
        maintenance_level=request.maintenance_level,
        environmental_conditions=request.environmental_conditions,
        cracks_detected=request.cracks_detected,
        corrosion_level=request.corrosion_level,
        predicted_remaining_life=prediction["predicted_remaining_life"],
        risk_category=prediction["risk_category"],
        notes=prediction["explanation"]
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    prediction["id"] = record.id
    prediction["created_at"] = record.created_at
    return prediction


@router.get("/history")
def get_bridge_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    records = db.query(BridgeRecord).order_by(desc(BridgeRecord.created_at)).limit(limit).all()
    return records
