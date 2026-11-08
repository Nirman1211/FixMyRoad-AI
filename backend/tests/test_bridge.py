from app.services.bridge_service import bridge_service


def test_bridge_prediction_concrete_healthy():
    res = bridge_service.predict_remaining_life(
        age=10,
        material="Concrete",
        span_length=50.0,
        traffic_load=8000,
        maintenance_level="High",
        environmental_conditions="Normal",
        cracks_detected="no",
        corrosion_level=1,
        bridge_name="North River Viaduct"
    )
    assert res["predicted_remaining_life"] > 35.0
    assert res["risk_category"] == "GOOD"
    assert "disclaimer" in res


def test_bridge_prediction_steel_aged_critical():
    res = bridge_service.predict_remaining_life(
        age=75,
        material="Steel",
        span_length=120.0,
        traffic_load=35000,
        maintenance_level="Low",
        environmental_conditions="Harsh",
        cracks_detected="yes",
        corrosion_level=9,
        bridge_name="Old Harbor Crossing"
    )
    assert res["predicted_remaining_life"] < 25.0
    assert res["risk_category"] in ("CRITICAL", "MODERATE")
