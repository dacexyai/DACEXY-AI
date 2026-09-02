from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import Optional

from app.config import settings
from app.db import init_db
from app.routers import auth_router, razorpay_router, license_router, health_router, usage_router, chat_router
from app.middleware import setup_middleware
from app.auth import get_current_user


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    if settings.auto_create_db:
        init_db()
    yield
    # Shutdown
    pass


app = FastAPI(title="Dacexy AI Backend", lifespan=lifespan)

# Setup middleware
setup_middleware(app)

# CORS - Restrictive configuration for production
cors_origins = [settings.frontend_url]
if settings.app_env != "production":
    cors_origins.extend(["http://localhost:3000", "http://localhost:5173"])
# Production web deployments may use a Vercel preview URL. Keep the configured
# production frontend as the primary allowlist while permitting only HTTPS
# Vercel origins for preview deployments. Credentials remain enabled.
cors_origin_regex = r"^https://([a-zA-Z0-9-]+\.)*vercel\.app$" if settings.app_env == "production" else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(health_router.router)
app.include_router(auth_router.router)
app.include_router(auth_router.legacy_router)
app.include_router(razorpay_router.router)
app.include_router(license_router.router)
app.include_router(license_router.legacy_router)
app.include_router(usage_router.router)
app.include_router(chat_router.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "dacexy-backend", "version": "1.0.1", "api_version": "v1"}


@app.get("/api/v1/health")
def health_v1():
    return {"status": "ok", "service": "dacexy-backend", "version": "1.0.1", "api_version": "v1"}


@app.get("/api/v1/health/auth")
def health_auth(user=Depends(get_current_user)):
    return {"status": "ok", "service": "dacexy-backend", "version": "1.0.1", "api_version": "v1", "authenticated": True}
