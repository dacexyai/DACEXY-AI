"""Usage tracking and rate limiting per plan."""

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import get_current_user
from app.db import get_db
from app.models import User, UsageLog, Subscription
from app.entitlements import effective_plan

router = APIRouter(prefix="/api/v1/usage", tags=["usage"])


# Usage limits per plan (monthly) - Updated per requirement
# FREE: 100 calls
# BUSINESS (₹2000): 50000 calls
# ENTERPRISE (₹10000): unlimited
PLAN_LIMITS = {
    "free": {"monthly_api_calls": 100, "cost_per_call": 30},
    "business": {"monthly_api_calls": 50000, "cost_per_call": 250},
    "enterprise": {"monthly_api_calls": -1, "cost_per_call": 1000},
}

class UsageResponse(BaseModel):
    plan: str
    monthly_limit: int
    calls_used: int
    calls_remaining: int
    monthly_cost: int  # in rupees
    overage_cost: int  # in rupees


def get_month_range():
    """Get start and end of current month."""
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if now.month == 12:
        month_end = month_start.replace(year=now.year + 1, month=1)
    else:
        month_end = month_start.replace(month=now.month + 1)
    return month_start, month_end


@router.post("/log-call")
def log_api_call(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    call_type: str = "skill_execution"
):
    """Log an API call and check if within limits."""
    
    # Lock the owning user row on databases that support row-level locks.
    # This serializes usage reservations for the same account across API workers.
    user_locked = db.query(User).filter(User.id == user.id).with_for_update().first()
    if not user_locked:
        raise HTTPException(status_code=401, detail="User not found")
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    plan = effective_plan(subscription)
    
    limit_info = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    monthly_limit = limit_info["monthly_api_calls"]
    
    # Get month range
    month_start, month_end = get_month_range()
    
    # Count calls this month
    calls_this_month = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == user.id,
        UsageLog.created_at >= month_start,
        UsageLog.created_at < month_end
    ).scalar() or 0
    
    # Check limit (if not unlimited)
    if monthly_limit > 0 and calls_this_month >= monthly_limit:
        raise HTTPException(
            status_code=429,
            detail=f"Monthly API limit ({monthly_limit}) exceeded for {plan} plan"
        )
    
    # Log the call
    usage_log = UsageLog(
        user_id=user.id,
        api_call_type=call_type,
        cost_rupees=limit_info["cost_per_call"]
    )
    db.add(usage_log)
    db.commit()
    
    return {"status": "logged", "call_count": calls_this_month + 1}


@router.get("/stats")
def get_usage_stats(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UsageResponse:
    """Get current month usage and limits."""
    
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    plan = effective_plan(subscription)
    
    limit_info = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    monthly_limit = limit_info["monthly_api_calls"]
    cost_per_call = limit_info["cost_per_call"]
    
    # Get month range
    month_start, month_end = get_month_range()
    
    # Count calls this month
    calls_this_month = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == user.id,
        UsageLog.created_at >= month_start,
        UsageLog.created_at < month_end
    ).scalar() or 0
    
    # Calculate remaining
    if monthly_limit > 0:
        calls_remaining = max(0, monthly_limit - calls_this_month)
    else:
        calls_remaining = -1  # unlimited
    
    # Calculate costs
    monthly_cost = 0  # base plan cost (Razorpay handles this)
    overage_cost = max(0, calls_this_month - (monthly_limit if monthly_limit > 0 else calls_this_month)) * cost_per_call
    
    return UsageResponse(
        plan=plan,
        monthly_limit=monthly_limit if monthly_limit > 0 else -1,
        calls_used=calls_this_month,
        calls_remaining=calls_remaining,
        monthly_cost=0,  # subscription cost handled separately
        overage_cost=overage_cost
    )


@router.post("/check-limit")
def check_rate_limit(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check if user can make another API call."""
    
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    plan = effective_plan(subscription)
    
    limit_info = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    monthly_limit = limit_info["monthly_api_calls"]
    
    # Get month range
    month_start, month_end = get_month_range()
    
    # Count calls this month
    calls_this_month = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == user.id,
        UsageLog.created_at >= month_start,
        UsageLog.created_at < month_end
    ).scalar() or 0
    
    # Check limit
    allowed = monthly_limit < 0 or calls_this_month < monthly_limit
    
    return {
        "allowed": allowed,
        "plan": plan,
        "calls_used": calls_this_month,
        "calls_limit": monthly_limit
    }
