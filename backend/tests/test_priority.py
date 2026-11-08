from datetime import datetime, timezone, timedelta
from app.services.priority_service import priority_service
from app.models.report import DamageSeverity, RoadType


def test_priority_critical_severity():
    now = datetime.now(timezone.utc)
    res = priority_service.calculate_priority(
        severity=DamageSeverity.CRITICAL,
        upvotes=10,
        downvotes=0,
        road_type=RoadType.HIGHWAY,
        created_at=now - timedelta(days=5),
        duplicate_count=2,
        is_near_critical_facility=True
    )
    assert res["total_score"] >= 75.0
    assert res["priority_level"] == "CRITICAL"
    assert res["severity_component"] == 100.0
    assert res["road_importance_component"] == 100.0


def test_priority_low_severity_no_votes():
    now = datetime.now(timezone.utc)
    res = priority_service.calculate_priority(
        severity=DamageSeverity.LOW,
        upvotes=0,
        downvotes=0,
        road_type=RoadType.RESIDENTIAL,
        created_at=now,
        duplicate_count=0
    )
    assert res["total_score"] < 40.0
    assert res["priority_level"] == "LOW"
    assert res["community_component"] == 0.0
    assert res["duplicate_component"] == 0.0


def test_priority_net_downvotes_safeguard():
    now = datetime.now(timezone.utc)
    res = priority_service.calculate_priority(
        severity=DamageSeverity.MEDIUM,
        upvotes=2,
        downvotes=50,  # Highly downvoted
        road_type=RoadType.SECONDARY,
        created_at=now
    )
    # Ensure net negative votes do not drive total priority negative
    assert res["community_component"] == 0.0
    assert res["total_score"] > 0.0
