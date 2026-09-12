from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.db import get_db
from app.models import User, License
from app.entitlements import effective_plan, has_paid_entitlement

router = APIRouter(prefix="/api/v1/license", tags=["license"])


class VerifyBody(BaseModel):
    key: str = ""
    machine_id: str


class VerifyOut(BaseModel):
    valid: bool
    plan: str
    business_skills_enabled: bool


class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


def _verify_for_user(body: VerifyBody, user: User, db: Session) -> VerifyOut:
    """Validate a user's license without allowing cross-account license use.

    An empty key is intentionally accepted for the free tier so the shipped
    desktop agent can keep its existing optional-license UI unchanged.
    """
    if not body.key:
        subscription = user.subscription
        plan = effective_plan(subscription)
        entitled = has_paid_entitlement(subscription)
        return VerifyOut(valid=True, plan=plan, business_skills_enabled=entitled)

    lic = db.query(License).filter(License.key == body.key, License.active.is_(True)).first()
    if not lic:
        return VerifyOut(valid=False, plan="none", business_skills_enabled=False)

    if lic.user_id != user.id:
        raise HTTPException(status_code=403, detail="License belongs to another account")
    if lic.machine_id and lic.machine_id != body.machine_id:
        raise HTTPException(status_code=403, detail="License already activated on another machine")

    if not lic.machine_id:
        lic.machine_id = body.machine_id
    lic.last_seen_at = datetime.now(timezone.utc)
    db.commit()

    subscription = user.subscription
    plan = effective_plan(subscription)
    entitled = has_paid_entitlement(subscription)
    return VerifyOut(valid=True, plan=plan, business_skills_enabled=entitled)


@router.get("/mine")
def my_license(user: User = Depends(get_current_user)):
    if not user.license:
        raise HTTPException(status_code=404, detail="No license found")
    return {"key": user.license.key}


@router.post("/verify", response_model=VerifyOut)
def verify_license(
    body: VerifyBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _verify_for_user(body, user, db)


# Backward-compatible alias for the shipped desktop agent.
legacy_router = APIRouter(prefix="/api/license", tags=["license-legacy"])


@legacy_router.post("/verify", response_model=VerifyOut, include_in_schema=False)
def legacy_verify_license(
    body: VerifyBody,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return _verify_for_user(body, user, db)
