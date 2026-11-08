import os
from fastapi import status


def test_get_reports_public(client):
    response = client.get("/api/v1/reports")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_get_map_reports(client):
    response = client.get("/api/v1/maps/reports")
    assert response.status_code == status.HTTP_200_OK
    assert isinstance(response.json(), list)


def test_get_map_nearby(client):
    response = client.get("/api/v1/maps/nearby?lat=40.7128&lon=-74.0060&radius_km=5.0")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "count" in data
    assert "reports" in data


def test_predict_bridge_api(client):
    payload = {
        "bridge_name": "Test Municipal Span",
        "age": 20,
        "material": "Concrete",
        "span_length": 65.0,
        "traffic_load": 15000,
        "maintenance_level": "Medium",
        "environmental_conditions": "Normal",
        "cracks_detected": "no",
        "corrosion_level": 3
    }
    response = client.post("/api/v1/bridge/predict", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "predicted_remaining_life" in data
    assert "risk_category" in data


def test_analytics_overview(client):
    response = client.get("/api/v1/analytics/overview")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "total_reports" in data
    assert "average_resolution_days" in data
