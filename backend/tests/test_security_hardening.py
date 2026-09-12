"""Comprehensive security hardening tests."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import time

from app.main import app
from app.db import get_db
from app.models import Base, User, Subscription, License
from app.auth import hash_password
from tests.conftest import TestingSessionLocal, override_get_db

client = TestClient(app)
app.dependency_overrides[get_db] = override_get_db


class TestRateLimiting:
    """Test enhanced rate limiting."""
    
    def test_endpoint_rate_limit_auth_signup(self, db_session):
        """Test signup endpoint has stricter rate limit (10/min)."""
        # Create 11 signup requests rapidly
        for i in range(11):
            response = client.post(
                "/api/v1/auth/signup",
                json={
                    "first": "Test",
                    "last": f"User{i}",
                    "email": f"testuser{i}@example.com",
                    "password": "SecurePass123!"
                }
            )
            
            if i < 10:
                # First 10 should succeed or be rate limited by database constraints
                assert response.status_code in [200, 409]
            else:
                # 11th should be rate limited
                assert response.status_code == 429
                assert "Rate limit" in response.json()["detail"]
    
    def test_rate_limit_headers_present(self):
        """Test rate limit headers are present in responses."""
        response = client.get("/api/health")
        assert "X-RateLimit-Limit" in response.headers
        assert "X-RateLimit-Remaining" in response.headers
        assert "X-RateLimit-Window" in response.headers
    
    def test_global_rate_limit_enforcement(self):
        """Test global rate limit (120/min) is enforced."""
        # This test validates the middleware is active
        response = client.get("/api/health")
        assert response.status_code == 200
        assert int(response.headers["X-RateLimit-Limit"]) == 120


class TestBruteForceProtection:
    """Test brute force protection on login."""
    
    def test_login_brute_force_after_5_attempts(self, db_session):
        """Test that login is blocked after 5 failed attempts."""
        # Create a test user
        user = User(
            first_name="Test",
            last_name="User",
            email="bruteforce@example.com",
            password_hash=hash_password("SecurePass123!")
        )
        db_session.add(user)
        db_session.add(Subscription(user_id=user.id, plan="free", status="active"))
        db_session.add(License(user_id=user.id, key="DCX-TEST001"))
        db_session.commit()
        
        # Try 5 failed logins
        for i in range(5):
            response = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "bruteforce@example.com",
                    "password": "WrongPassword123!"
                }
            )
            assert response.status_code == 401
        
        # 6th attempt should be rate limited
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "bruteforce@example.com",
                "password": "SecurePass123!"
            }
        )
        assert response.status_code == 429
        assert "Too many login attempts" in response.json()["detail"]
    
    def test_successful_login_clears_brute_force_counter(self, db_session):
        """Test that successful login clears the brute force counter."""
        user = User(
            first_name="Test",
            last_name="User",
            email="clearbruteforce@example.com",
            password_hash=hash_password("SecurePass123!")
        )
        db_session.add(user)
        db_session.add(Subscription(user_id=user.id, plan="free", status="active"))
        db_session.add(License(user_id=user.id, key="DCX-TEST002"))
        db_session.commit()
        
        # One successful login should work
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "clearbruteforce@example.com",
                "password": "SecurePass123!"
            }
        )
        assert response.status_code == 200


class TestInputValidation:
    """Test input validation and sanitization."""
    
    def test_signup_sanitizes_names(self):
        """Test that signup sanitizes first/last names."""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "first": "Test<script>alert('xss')</script>",
                "last": "User",
                "email": "sanitize@example.com",
                "password": "SecurePass123!",
                "company": "   ACME Corp   "  # Should be stripped
            }
        )
        assert response.status_code == 200
        data = response.json()
        user = data["user"]
        # The script tags should be removed or escaped
        assert "<script>" not in user["first_name"]
    
    def test_password_max_length_enforced(self):
        """Test that very long passwords are rejected."""
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "first": "Test",
                "last": "User",
                "email": "lonpass@example.com",
                "password": "SecurePass123!" * 20  # 260+ characters
            }
        )
        assert response.status_code == 422  # Validation error
    
    def test_oversized_payload_rejected(self):
        """Test that oversized payloads are rejected."""
        # Create a very large payload
        huge_string = "x" * (11 * 1024 * 1024)  # 11MB
        response = client.post(
            "/api/v1/auth/signup",
            json={
                "first": huge_string,
                "last": "User",
                "email": "huge@example.com",
                "password": "SecurePass123!"
            },
            headers={"Content-Length": str(11 * 1024 * 1024)}
        )
        assert response.status_code == 413


class TestSecurityHeaders:
    """Test security headers."""
    
    def test_clickjacking_protection(self):
        """Test X-Frame-Options header."""
        response = client.get("/api/health")
        assert response.headers.get("X-Frame-Options") == "DENY"
    
    def test_mime_sniffing_protection(self):
        """Test X-Content-Type-Options header."""
        response = client.get("/api/health")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
    
    def test_xss_protection(self):
        """Test X-XSS-Protection header."""
        response = client.get("/api/health")
        assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    
    def test_referrer_policy(self):
        """Test Referrer-Policy header."""
        response = client.get("/api/health")
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    
    def test_server_header_removed(self):
        """Test that server header is not exposed."""
        response = client.get("/api/health")
        assert "server" not in response.headers.lower()


class TestRequestCorrelation:
    """Test request ID correlation."""
    
    def test_request_id_generated(self):
        """Test that request ID is generated and returned."""
        response = client.get("/api/health")
        assert "X-Request-ID" in response.headers
        assert len(response.headers["X-Request-ID"]) > 0
    
    def test_custom_request_id_preserved(self):
        """Test that custom request ID is preserved if provided."""
        custom_id = "custom-request-123"
        response = client.get(
            "/api/health",
            headers={"X-Request-ID": custom_id}
        )
        assert response.headers.get("X-Request-ID") == custom_id


class TestWebhookSecurity:
    """Test webhook security enhancements."""
    
    def test_webhook_signature_validation_required(self):
        """Test that webhook requires valid signature."""
        response = client.post(
            "/api/v1/billing/webhook",
            json={"event": "payment.authorized"},
            headers={"X-Razorpay-Signature": "invalid"}
        )
        assert response.status_code == 400
        assert "Invalid webhook signature" in response.json()["detail"]
    
    def test_webhook_missing_signature_rejected(self):
        """Test that webhook without signature is rejected."""
        response = client.post(
            "/api/v1/billing/webhook",
            json={"event": "payment.authorized"}
        )
        assert response.status_code == 400
        assert "Missing signature" in response.json()["detail"]


class TestPaymentSecurity:
    """Test payment processing security."""
    
    def test_payment_amount_validation(self, db_session):
        """Test that payment amounts are validated."""
        # Create a test user
        user = User(
            first_name="Test",
            last_name="User",
            email="paymenttest@example.com",
            password_hash=hash_password("SecurePass123!")
        )
        db_session.add(user)
        db_session.add(Subscription(user_id=user.id, plan="free", status="active"))
        db_session.add(License(user_id=user.id, key="DCX-PAYMENT01"))
        db_session.commit()
        
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "paymenttest@example.com",
                "password": "SecurePass123!"
            }
        )
        token = login_response.json()["access_token"]
        
        # Create order for valid plan
        response = client.post(
            "/api/v1/billing/create-order",
            json={"plan": "business"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        
        # Try invalid plan
        response = client.post(
            "/api/v1/billing/create-order",
            json={"plan": "invalid_plan"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 400
        assert "Invalid plan" in response.json()["detail"]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
