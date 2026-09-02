"""Usage tracking and rate limiting tests."""

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


def test_log_api_call():
    """Test logging an API call."""
    token = get_token()
    res = client.post(
        "/api/v1/usage/log-call",
        headers={"Authorization": f"Bearer {token}"},
        params={"call_type": "skill_execution"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "logged"


def test_get_usage_stats():
    """Test getting usage statistics."""
    token = get_token()
    res = client.get(
        "/api/v1/usage/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "plan" in data
    assert "calls_used" in data
    assert "monthly_limit" in data


def test_check_rate_limit():
    """Test rate limit check."""
    token = get_token()
    res = client.post(
        "/api/v1/usage/check-limit",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert res.status_code == 200
    data = res.json()
    assert "allowed" in data
    assert "plan" in data


def test_free_plan_100_call_limit():
    """Test free plan has 100 call/month limit."""
    token = get_token()
    
    # Check initial stats
    res = client.get(
        "/api/v1/usage/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    data = res.json()
    assert data["plan"] == "free"
    assert data["monthly_limit"] == 100


def test_usage_stats_overage_cost():
    """Test overage cost calculation."""
    token = get_token()
    
    res = client.get(
        "/api/v1/usage/stats",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    data = res.json()
    # Free plan: 100 calls/month, ₹30 loss per overage call
    assert "overage_cost" in data
