from fastapi import status


def test_register_new_user(client):
    payload = {
        "email": "fresh_user@example.com",
        "password": "Password123!",
        "first_name": "Fresh",
        "last_name": "Tester",
        "phone": "+1-555-8888",
        "role": "citizen"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["email"] == "fresh_user@example.com"
    assert data["first_name"] == "Fresh"
    assert "hashed_password" not in data


def test_register_duplicate_email(client):
    payload = {
        "email": "test_citizen@fixmyroad.org",
        "password": "Password123!",
        "first_name": "Duplicate",
        "last_name": "Tester"
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_login_success(client):
    payload = {
        "email": "test_citizen@fixmyroad.org",
        "password": "CitizenPass123"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "citizen"


def test_login_invalid_credentials(client):
    payload = {
        "email": "test_citizen@fixmyroad.org",
        "password": "WrongPassword999"
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_get_current_user_profile(client, citizen_headers):
    response = client.get("/api/v1/auth/me", headers=citizen_headers)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["email"] == "test_citizen@fixmyroad.org"
