"""Auth endpoint tests."""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_signup():
    """Test user signup."""
    res = client.post("/api/v1/auth/signup", json={
        "first": "Test",
        "last": "User",
        "email": f"test_{id(object())}@example.com",
        "company": "Test Co",
        "password": "TestPassword123!"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_signup_duplicate_email():
    """Test signup fails with duplicate email."""
    email = f"dup_{id(object())}@example.com"
    client.post("/api/v1/auth/signup", json={
        "first": "Test", "last": "User", "email": email, "company": "Co", "password": "TestPassword123!"
    })
    res = client.post("/api/v1/auth/signup", json={
        "first": "Test", "last": "User", "email": email, "company": "Co", "password": "TestPassword123!"
    })
    assert res.status_code == 409


def test_login():
    """Test login."""
    email = f"login_{id(object())}@example.com"
    client.post("/api/v1/auth/signup", json={
        "first": "Test", "last": "User", "email": email, "company": "Co", "password": "TestPassword123!"
    })
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "TestPassword123!"})
    assert res.status_code == 200
    assert "access_token" in res.json()


def test_login_invalid_password():
    """Test login fails with wrong password."""
    email = f"pwd_{id(object())}@example.com"
    client.post("/api/v1/auth/signup", json={
        "first": "Test", "last": "User", "email": email, "company": "Co", "password": "TestPassword123!"
    })
    res = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPass!"})
    assert res.status_code == 401


def test_password_strength_validation():
    """Test password strength validation."""
    # Test weak passwords
    weak_passwords = [
        "short",  # Too short
        "nouppercase123!",  # No uppercase
        "NOLOWERCASE123!",  # No lowercase
        "NoDigits!",  # No digits
        "NoSpecialChars123",  # No special characters
    ]
    
    for password in weak_passwords:
        res = client.post("/api/v1/auth/signup", json={
            "first": "Test", "last": "User", "email": f"weak_{id(object())}@example.com", 
            "company": "Co", "password": password
        })
        assert res.status_code == 422  # Validation error


def test_strong_password_accepted():
    """Test strong password is accepted."""
    res = client.post("/api/v1/auth/signup", json={
        "first": "Test", "last": "User", "email": f"strong_{id(object())}@example.com",
        "company": "Co", "password": "StrongPassword123!"
    })
    assert res.status_code == 200
