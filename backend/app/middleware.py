"""Custom middleware for security and logging."""
from fastapi import Request, Response
from fastapi.middleware.gzip import GZipMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
import time
import logging
from collections import defaultdict
from typing import Dict, Tuple
from fastapi import HTTPException
import hashlib
import uuid
from datetime import datetime, timedelta
import os
try:
    import redis
except ImportError:
    redis = None

logger = logging.getLogger(__name__)


class EnhancedRateLimiter:
    """Enterprise-grade token bucket rate limiter with per-endpoint limits."""
    
    def __init__(self):
        # Global limits
        self.global_requests_per_minute = 120
        # Per-endpoint stricter limits
        self.endpoint_limits = {
            "/api/v1/auth/signup": (10, 60),  # 10 per minute
            "/api/v1/auth/login": (15, 60),   # 15 per minute (brute force protection)
            "/api/v1/auth/refresh": (30, 60), # 30 per minute
            "/api/v1/billing/webhook": (60, 60), # 60 per minute (webhooks)
            "/api/v1/billing/create-order": (20, 60), # 20 per minute
            "/api/v1/usage/log-call": (100, 60), # 100 per minute (most frequent)
            "/api/v1/chat": (20, 60), # protect the AI provider from rapid retries
        }
        # Per-IP request tracking: {ip: {endpoint: [(timestamp, weight), ...]}}
        self.requests: Dict[str, Dict[str, list]] = defaultdict(lambda: defaultdict(list))
        self.cleanup_interval = 300  # cleanup every 5 minutes
        self.last_cleanup = time.time()
        self.redis = None
        redis_url = os.getenv("REDIS_URL")
        if redis_url and redis is not None:
            try:
                client = redis.Redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
                client.ping()
                self.redis = client
                logger.info("Rate limiter using Redis backend")
            except Exception:
                logger.warning("Redis unavailable; using in-memory rate limiter", exc_info=True)
    
    def _cleanup(self):
        """Remove old request records to prevent memory bloat."""
        now = time.time()
        if now - self.last_cleanup > self.cleanup_interval:
            five_min_ago = now - 300
            for ip in list(self.requests.keys()):
                for endpoint in list(self.requests[ip].keys()):
                    self.requests[ip][endpoint] = [
                        t for t in self.requests[ip][endpoint] if t > five_min_ago
                    ]
                    if not self.requests[ip][endpoint]:
                        del self.requests[ip][endpoint]
                if not self.requests[ip]:
                    del self.requests[ip]
            self.last_cleanup = now
    
    def is_allowed(self, client_ip: str, endpoint: str) -> Tuple[bool, Dict]:
        """Check if request is allowed. Returns (allowed, rate_limit_info)."""
        self._cleanup()
        now = time.time()
        
        # Get limit for this endpoint, fall back to global
        if endpoint in self.endpoint_limits:
            limit, window = self.endpoint_limits[endpoint]
        else:
            limit = self.global_requests_per_minute
            window = 60
        
        if self.redis is not None:
            try:
                bucket = f"dacexy:ratelimit:{endpoint}:{client_ip}"
                count = self.redis.incr(bucket)
                if count == 1:
                    self.redis.expire(bucket, window)
                return count <= limit, {"limit": limit, "window": window, "current_count": count, "remaining": max(0, limit - count)}
            except Exception:
                logger.warning("Redis rate-limit operation failed; using in-memory fallback", exc_info=True)

        window_start = now - window
        endpoint_requests = self.requests[client_ip][endpoint]
        
        # Count requests in window
        recent_requests = [t for t in endpoint_requests if t > window_start]
        request_count = len(recent_requests)
        
        allowed = request_count < limit
        
        if allowed:
            # Add request timestamp
            endpoint_requests.append(now)
        
        return allowed, {
            "limit": limit,
            "window": window,
            "current_count": request_count,
            "remaining": max(0, limit - request_count)
        }


rate_limiter = EnhancedRateLimiter()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
       
        # Remove server header
        if "server" in response.headers:
            del response.headers["server"]
        
        return response


class EnhancedRateLimitMiddleware(BaseHTTPMiddleware):
    """Enterprise rate limiting middleware with per-endpoint limits."""
    
    async def dispatch(self, request: Request, call_next):
        # Only trust forwarding headers when the deployment explicitly enables them.
        # Otherwise clients can spoof X-Forwarded-For and evade per-IP limits.
        trust_proxy_headers = os.getenv("TRUST_PROXY_HEADERS", "false").lower() == "true"
        if trust_proxy_headers:
            client_ip = (
                request.headers.get("x-forwarded-for", "").split(",")[0].strip() or
                request.headers.get("x-real-ip", "") or
                (request.client.host if request.client else "unknown")
            )
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        endpoint = request.url.path
        allowed, rate_info = rate_limiter.is_allowed(client_ip, endpoint)
        local_bypass = os.getenv("APP_ENV", "development").lower() != "production"
        if not allowed and not (local_bypass and client_ip in ("127.0.0.1", "localhost", "::1")):
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {rate_info['limit']} requests per {rate_info['window']}s"
            )

        response = await call_next(request)
        
        # Add rate limit headers to response
        response.headers["X-RateLimit-Limit"] = str(rate_info["limit"])
        response.headers["X-RateLimit-Remaining"] = str(rate_info["remaining"])
        response.headers["X-RateLimit-Window"] = str(rate_info["window"])
        
        return response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Request logging middleware for audit trails with request correlation IDs."""
    
    async def dispatch(self, request: Request, call_next):
        # Generate request ID if not present
        request_id = request.headers.get("x-request-id", "")
        if not request_id or len(request_id) > 128 or not all(c.isalnum() or c in "-_." for c in request_id):
            request_id = str(uuid.uuid4())
        start_time = time.time()
        
        # Match the rate limiter's trusted-proxy policy.
        trust_proxy_headers = os.getenv("TRUST_PROXY_HEADERS", "false").lower() == "true"
        if trust_proxy_headers:
            client_ip = (
                request.headers.get("x-forwarded-for", "").split(",")[0].strip() or
                request.headers.get("x-real-ip", "") or
                (request.client.host if request.client else "unknown")
            )
        else:
            client_ip = request.client.host if request.client else "unknown"
        
        # Log request
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} | "
            f"Client: {client_ip} | User-Agent: {request.headers.get('user-agent', 'N/A')[:60]}"
        )
        
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(
            f"[{request_id}] Response: {response.status_code} | Duration: {process_time:.3f}s"
        )
        
        # Add headers
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        return response


class _PayloadTooLarge(Exception):
    pass


class InputValidationMiddleware:
    """Enforce a hard 10 MiB request-body limit, including chunked requests."""

    MAX_BODY_BYTES = 10 * 1024 * 1024

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http" or scope.get("method") not in {"POST", "PUT", "PATCH"}:
            await self.app(scope, receive, send)
            return

        content_length = None
        for key, value in scope.get("headers", []):
            if key.lower() == b"content-length":
                try:
                    content_length = int(value)
                except ValueError:
                    await self._reject(send, 400, "Invalid Content-Length")
                    return
                break
        if content_length is not None and content_length > self.MAX_BODY_BYTES:
            await self._reject(send, 413, "Request payload too large")
            return

        received = 0

        async def limited_receive():
            nonlocal received
            message = await receive()
            if message.get("type") == "http.request":
                received += len(message.get("body", b""))
                if received > self.MAX_BODY_BYTES:
                    raise _PayloadTooLarge()
            return message

        started = False

        async def tracked_send(message):
            nonlocal started
            if message.get("type") == "http.response.start":
                started = True
            await send(message)

        try:
            await self.app(scope, limited_receive, tracked_send)
        except _PayloadTooLarge:
            if not started:
                await self._reject(send, 413, "Request payload too large")
            else:
                raise

    async def _reject(self, send, status, detail):
        body = (f'{{"detail":"{detail}"}}').encode("utf-8")
        await send({"type": "http.response.start", "status": status, "headers": [(b"content-type", b"application/json"), (b"content-length", str(len(body)).encode())]})
        await send({"type": "http.response.body", "body": body})


def setup_middleware(app):
    """Setup all middleware for the application (order matters!)."""
    # Input validation first
    app.add_middleware(InputValidationMiddleware)
    
    # Rate limiting early
    app.add_middleware(EnhancedRateLimitMiddleware)
    
    # Request logging
    app.add_middleware(RequestLoggingMiddleware)
    
    # Security headers last (applies to all)
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Compression
    app.add_middleware(GZipMiddleware, minimum_size=1000)
