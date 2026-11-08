import math
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from app.models.report import DamageSeverity, RoadType


class PriorityService:
    WEIGHT_SEVERITY = 0.30
    WEIGHT_COMMUNITY = 0.20
    WEIGHT_ROAD = 0.15
    WEIGHT_AGE = 0.15
    WEIGHT_LOCATION = 0.10
    WEIGHT_DUPLICATE = 0.10

    ROAD_SCORES = {
        RoadType.HIGHWAY: 100.0,
        RoadType.PRIMARY: 80.0,
        RoadType.SECONDARY: 60.0,
        RoadType.RESIDENTIAL: 40.0,
        RoadType.ALLEY: 20.0
    }

    SEVERITY_SCORES = {
        DamageSeverity.CRITICAL: 100.0,
        DamageSeverity.HIGH: 75.0,
        DamageSeverity.MEDIUM: 50.0,
        DamageSeverity.LOW: 25.0
    }

    @classmethod
    def calculate_priority(
        cls,
        severity: DamageSeverity,
        upvotes: int,
        downvotes: int,
        road_type: RoadType,
        created_at: datetime,
        duplicate_count: int = 0,
        is_near_critical_facility: bool = False
    ) -> Dict[str, Any]:
        """
        Computes a normalized, explainable priority score between 0 and 100.
        """
        # 1. Visual Severity Component (0-100)
        s_score = cls.SEVERITY_SCORES.get(severity, 25.0)

        # 2. Community Evidence Component (0-100)
        # Net votes logarithmic scaling protects against manipulation
        net_votes = max(0, upvotes - downvotes)
        if net_votes <= 0:
            c_score = 0.0
        else:
            c_score = min(100.0, 28.0 * math.log(1.0 + net_votes))

        # 3. Road Importance Component (0-100)
        r_score = cls.ROAD_SCORES.get(road_type, 40.0)

        # 4. Report Age Factor (0-100)
        now = datetime.now(timezone.utc)
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        age_days = max(0.0, (now - created_at).total_seconds() / 86400.0)
        # Asymptotically approaches 100 over ~14-21 days
        a_score = min(100.0, 100.0 * (1.0 - math.exp(-age_days / 10.0)))

        # 5. Location Risk Factor (0-100)
        l_score = 75.0 if is_near_critical_facility else 30.0

        # 6. Duplicate Evidence Factor (0-100)
        # Corroborating reports nearby indicate an extensive defect
        d_score = min(100.0, float(duplicate_count) * 25.0)

        # Total Weighted Score
        total_score = round(
            (cls.WEIGHT_SEVERITY * s_score) +
            (cls.WEIGHT_COMMUNITY * c_score) +
            (cls.WEIGHT_ROAD * r_score) +
            (cls.WEIGHT_AGE * a_score) +
            (cls.WEIGHT_LOCATION * l_score) +
            (cls.WEIGHT_DUPLICATE * d_score),
            2
        )

        # Priority Level Classification
        if total_score >= 75.0:
            level = "CRITICAL"
        elif total_score >= 55.0:
            level = "HIGH"
        elif total_score >= 35.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        return {
            "total_score": total_score,
            "severity_component": round(s_score, 2),
            "community_component": round(c_score, 2),
            "road_importance_component": round(r_score, 2),
            "age_component": round(a_score, 2),
            "location_risk_component": round(l_score, 2),
            "duplicate_component": round(d_score, 2),
            "priority_level": level,
            "weights_version": "1.0.0"
        }


priority_service = PriorityService()
