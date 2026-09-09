import uuid
import re
import time
from typing import Optional
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import update
from sqlalchemy.exc import IntegrityError

from app.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, verify_token_type, get_current_user
from app.db import get_db
from app.cache import cache_manager
from app.models import User, Subscription, License, RefreshSession
from app.entitlements import effective_plan

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

# Brute force protection: track failed login attempts
login_attempts: dict[str, list[float]] = defaultdict(list)
MAX_LOGIN_ATTEMPTS = 5
LOGIN_ATTEMPT_WINDOW = 300  # 5 minutes


def _sanitize_string(value: str, max_len: int = 255) -> str:
    """Sanitize string input to prevent injection attacks."""
    if not isinstance(value, str):
        return ""
    # Strip whitespace and limit length
    sanitized = value.strip()[:max_len]
    # Remove null bytes and control characters
    sanitized = ''.join(c for c in sanitized if ord(c) >= 32 or c in '\t\n\r')
    return sanitized


def _check_brute_force(email: str) -> None:
    """Check failed login attempts using Redis when available, memory otherwise."""
    key = f"auth:failed-login:{email.lower()}"
    cached = cache_manager.get(key)
    if cached is not None and int(cached.get("count", 0)) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(status_code=429, detail=f"Too many login attempts. Please try again in {LOGIN_ATTEMPT_WINDOW // 60} minutes.")
    now = time.time(); window_start = now - LOGIN_ATTEMPT_WINDOW
    login_attempts[email] = [t for t in login_attempts[email] if t > window_start]
    if len(login_attempts[email]) >= MAX_LOGIN_ATTEMPTS:
        raise HTTPException(status_code=429, detail=f"Too many login attempts. Please try again in {LOGIN_ATTEMPT_WINDOW // 60} minutes.")


def _record_failed_login(email: str) -> None:
    login_attempts[email].append(time.time())
    key = f"auth:failed-login:{email.lower()}"
    current = cache_manager.get(key) or {"count": 0}
    cache_manager.set(key, {"count": int(current.get("count", 0)) + 1}, LOGIN_ATTEMPT_WINDOW)


def _clear_login_attempts(email: str) -> None:
    login_attempts.pop(email, None)
    cache_manager.delete(f"auth:failed-login:{email.lower()}")


class SignupBody(BaseModel):
    first: str
    last: str
    email: EmailStr
    company: str | None = None
    password: str

    @field_validator('first', 'last', 'company', mode='before')
    @classmethod
    def sanitize_strings(cls, v):
        if v is None:
            return v
        return _sanitize_string(v, max_len=100)

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password must not exceed 72 UTF-8 bytes when using bcrypt')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    first_name: str
    last_name: str
    email: str
    company: str | None
    plan: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class RefreshTokenBody(BaseModel):
    refresh_token: str


class PaginatedUsersResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


def _user_out(user: User) -> UserOut:
    plan = effective_plan(user.subscription)
    return UserOut(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        company=user.company,
        plan=plan,
    )


@router.post("/signup", response_model=TokenOut)
def signup(body: SignupBody, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    user = User(
        first_name=body.first,
        last_name=body.last,
        email=body.email,
        company=body.company,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.flush()

    db.add(Subscription(user_id=user.id, plan="free", status="active"))
    db.add(License(user_id=user.id, key=f"DCX-{uuid.uuid4().hex[:20].upper()}"))
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        # The unique email constraint is the final concurrency guard.
        if db.query(User).filter(User.email == body.email).first():
            raise HTTPException(status_code=409, detail="An account with this email already exists") from exc
        raise HTTPException(status_code=409, detail="Unable to create the account; please retry") from exc
    db.refresh(user)

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id, db)
    db.commit()
    return TokenOut(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_out(user)
    )


@router.post("/login", response_model=TokenOut)
def login(body: LoginBody, db: Session = Depends(get_db)):
    # Check brute force
    _check_brute_force(body.email)
    
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.password_hash):
        _record_failed_login(body.email)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Clear brute force attempts on successful login
    _clear_login_attempts(body.email)
    
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id, db)
    db.commit()
    return TokenOut(
        access_token=access_token,
        refresh_token=refresh_token,
        user=_user_out(user)
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return _user_out(user)


@router.post("/refresh", response_model=TokenOut)
def refresh(body: RefreshTokenBody, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    try:
        payload = decode_token(body.refresh_token)
        verify_token_type(payload, "refresh")
        user_id = payload["sub"]
        jti = payload.get("jti")
        if not jti:
            raise HTTPException(status_code=401, detail="Refresh token is missing an identifier")
        now = datetime.now(timezone.utc)
        # Atomically consume the refresh session so two concurrent refreshes cannot
        # both rotate the same token. The unique JTI plus conditional UPDATE makes
        # this safe across multiple API workers.
        result = db.execute(
            update(RefreshSession)
            .where(
                RefreshSession.jti == jti,
                RefreshSession.user_id == user_id,
                RefreshSession.revoked_at.is_(None),
                RefreshSession.expires_at > now,
            )
            .values(revoked_at=now)
        )
        if result.rowcount != 1:
            db.rollback()
            raise HTTPException(status_code=401, detail="Refresh token has been revoked or expired")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(user.id)
        new_refresh_token = create_refresh_token(user.id, db)
        db.commit()
        return TokenOut(access_token=access_token, refresh_token=new_refresh_token, user=_user_out(user))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/users", response_model=PaginatedUsersResponse)
def list_users(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """List users with pagination (admin only - for now returns current user's data)."""
    # For security, only return current user's data in this implementation
    # In a real admin system, you would check for admin permissions
    
    offset = (page - 1) * page_size
    
    # Get total count (for this implementation, just count current user)
    total = 1
    
    # Get paginated results
    users = [user]
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedUsersResponse(
        items=[_user_out(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


# Backward-compatible aliases for the shipped desktop agent.
# The desktop source is intentionally left untouched; these aliases keep its
# existing /api/auth/* calls compatible with the versioned backend.
legacy_router = APIRouter(prefix="/api/auth", tags=["auth-legacy"])

@legacy_router.post("/signup", response_model=TokenOut, include_in_schema=False)
def legacy_signup(body: SignupBody, db: Session = Depends(get_db)):
    return signup(body, db)

@legacy_router.post("/login", response_model=TokenOut, include_in_schema=False)
def legacy_login(body: LoginBody, db: Session = Depends(get_db)):
    return login(body, db)

