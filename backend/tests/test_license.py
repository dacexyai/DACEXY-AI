"""License endpoint tests."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_token():
    """Helper to get auth token."""
    res = client.post("/api/v1/auth/signup", json={
        "first": "T", "last": "U", "email": f"t_{id(object())}@x.com", "company": "C", "password": "TestPassword123!"
    })
    return res.json()["access_token"]


def test_license_mine():
    """Test GET /api/license/mine returns license key."""
    token = get_token()
    res = client.get("/api/v1/license/mine", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert "key" in res.json()


def test_license_verify():
    """Test license verification and machine binding."""
    token = get_token()
    res = client.get("/api/v1/license/mine", headers={"Authorization": f"Bearer {token}"})
    key = res.json()["key"]
    
    res = client.post("/api/v1/license/verify", json={"key": key, "machine_id": "machine-123"})
    assert res.status_code == 200
    assert res.json()["valid"]
    assert res.json()["plan"] == "free"


def test_license_machine_binding():
    """Test machine binding prevents reuse on different machine."""
    token = get_token()
    res = client.get("/api/v1/license/mine", headers={"Authorization": f"Bearer {token}"})
    key = res.json()["key"]
    
    # Bind to machine 1
    res1 = client.post("/api/v1/license/verify", json={"key": key, "machine_id": "machine-1"})
    assert res1.status_code == 200
    
    # Try to bind same key to machine 2
    res2 = client.post("/api/v1/license/verify", json={"key": key, "machine_id": "machine-2"})
    assert res2.status_code == 403  # forbidden


def test_license_requires_auth():
    """Test license endpoint requires authentication."""
    res = client.get("/api/v1/license/mine")
    assert res.status_code == 403  # Rate limiting blocks unauthenticated requests
