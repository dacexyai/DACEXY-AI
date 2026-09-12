"""Health and readiness endpoints."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.auth import get_current_user
from app.db import engine
from app.models import User

router = APIRouter(prefix="/api/v1/gateway", tags=["gateway"])


@router.get("/health")
def health_check():
    """Liveness check: process is running."""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/ready")
def readiness_check():
    """Readiness check: the API can reach its configured database."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
    except Exception:
        return {"status": "not_ready", "database": "unavailable", "timestamp": datetime.now(timezone.utc).isoformat()}


@router.get("/gateway/health")
def gateway_health(current_user: User = Depends(get_current_user)):
    """Report the local OpenClaw configuration for authenticated diagnostics."""
    import json
    import os

    config_path = os.path.expanduser("~/.openclaw/openclaw.json")
    skills_path = os.path.expanduser("~/.openclaw/workspace/skills")

    try:
        skills_count = len(os.listdir(skills_path)) if os.path.exists(skills_path) else 0
    except OSError:
        skills_count = 0

    config_exists = os.path.exists(config_path)
    deepseek_key = "DEEPSEEK_API_KEY" in os.environ
    if config_exists and not deepseek_key:
        try:
            with open(config_path, encoding="utf-8") as fh:
                deepseek_key = "deepseek" in fh.read().lower()
        except OSError:
            pass

    return {
        "status": "ready" if config_exists else "unconfigured",
        "port": 18789,
        "skills_loaded": skills_count,
        "deepseek_configured": deepseek_key,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
