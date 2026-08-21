import pytest


def test_register_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "New Manager",
            "email": "manager@test.com",
            "password": "Password123!",
            "role": "Store Manager"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "manager@test.com"
    assert data["role"] == "Store Manager"
    assert "id" in data


def test_login_success(client, admin_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "admin123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client, admin_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@test.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_get_me(client, admin_headers):
    response = client.get("/api/auth/me", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@test.com"
