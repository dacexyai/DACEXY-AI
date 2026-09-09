"""Authoritative plan/task budget controls and request rate limiting."""
from datetime import datetime, timezone, timedelta
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import get_current_user
from app.db import get_db
from app.models import User, UsageLog, Subscription
from app.entitlements import effective_plan

router = APIRouter(prefix="/api/v1/usage", tags=["usage"])

# DACEXY's provider-cost safety budgets. These are OUR maximum target inference
# costs, not customer-facing credits. Costs are stored in paise.
PLAN_POLICIES = {
    "free": {
        "period": "week",
        "budget_paise": 500,          # ₹5/week
        "max_task_reservation_paise": 100,  # ₹1 safety envelope per task
        "task_timeout_seconds": 900,
        "max_concurrent_tasks": 1,
        "requests_per_minute": 8,
    },
    "business": {
        "period": "month",
        "budget_paise": 25000,        # ₹250/month
        "max_task_reservation_paise": 5000,  # ₹50 safety envelope per task
        "task_timeout_seconds": 1800,
        "max_concurrent_tasks": 3,
        "requests_per_minute": 30,
    },
    "enterprise": {
        "period": "month",
        "budget_paise": 100000,       # ₹1,000/month
        "max_task_reservation_paise": 20000, # ₹200 safety envelope per task
        "task_timeout_seconds": 3600,
        "max_concurrent_tasks": 8,
        "requests_per_minute": 60,
    },
}

# Conservative USD->INR conversion used only when OpenClaw reports USD cost.
# This is deliberately rounded up so DACEXY does not undercount provider cost.
USD_TO_INR = 100.0

class UsageResponse(BaseModel):
    plan: str
    period: str
    budget_rupees: float
    spent_rupees: float
    remaining_rupees: float
    monthly_limit: int
    calls_used: int
    calls_remaining: int
    monthly_cost: int
    overage_cost: int

class TaskAuthorizeResponse(BaseModel):
    allowed: bool
    plan: str
    task_id: str
    budget_rupees: float
    spent_rupees: float
    remaining_rupees: float
    reserved_rupees: float
    task_timeout_seconds: int
    max_concurrent_tasks: int
    reason: str | None = None

class TaskReportRequest(BaseModel):
    task_id: str
    cost_usd: float = 0.0
    input_tokens: int | None = None
    output_tokens: int | None = None
    status: str = "completed"


def _period_range(plan: str):
    now = datetime.now(timezone.utc)
    if PLAN_POLICIES[plan]["period"] == "week":
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    else:
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    return start, now


def _policy_and_subscription(user: User, db: Session):
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    plan = effective_plan(subscription)
    return plan, PLAN_POLICIES[plan]


def _spent_paise(user_id: str, start, end, db: Session) -> int:
    total = db.query(func.coalesce(func.sum(UsageLog.cost_rupees), 0)).filter(
        UsageLog.user_id == user_id,
        UsageLog.created_at >= start,
        UsageLog.created_at < end,
        UsageLog.status.in_(["completed", "failed", "timeout", "canceled"]),
    ).scalar() or 0
    return int(total)


def _active_reservations(user_id: str, start, db: Session) -> int:
    # Reservations older than 2 hours are stale and do not block the account.
    cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
    total = db.query(func.coalesce(func.sum(UsageLog.cost_rupees), 0)).filter(
        UsageLog.user_id == user_id,
        UsageLog.created_at >= start,
        UsageLog.created_at >= cutoff,
        UsageLog.status == "reserved",
    ).scalar() or 0
    return int(total)


@router.post("/authorize-task", response_model=TaskAuthorizeResponse)
def authorize_task(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Authoritative preflight budget gate before a real agent task starts."""
    user_locked = db.query(User).filter(User.id == user.id).with_for_update().first()
    if not user_locked:
        raise HTTPException(status_code=401, detail="User not found")
    plan, policy = _policy_and_subscription(user_locked, db)
    start, end = _period_range(plan)
    spent = _spent_paise(user.id, start, end, db)
    reserved = _active_reservations(user.id, start, db)
    now = datetime.now(timezone.utc)
    rpm_count = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == user.id,
        UsageLog.created_at >= now - timedelta(seconds=60),
        UsageLog.api_call_type == "agent_task",
    ).scalar() or 0
    active_count = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == user.id,
        UsageLog.status == "reserved",
        UsageLog.created_at >= now - timedelta(hours=2),
    ).scalar() or 0
    if int(rpm_count) >= policy["requests_per_minute"]:
        raise HTTPException(status_code=429, detail=f"Task request rate limit reached for your {plan} plan. Please wait a moment.")
    if int(active_count) >= policy["max_concurrent_tasks"]:
        raise HTTPException(status_code=429, detail=f"Maximum concurrent task limit reached for your {plan} plan.")
    remaining = max(0, policy["budget_paise"] - spent - reserved)
    if remaining <= 0:
        raise HTTPException(status_code=429, detail=f"DACEXY usage budget reached for your {plan} plan. Please wait for the next {policy['period']} or upgrade.")

    # Split the remaining safety budget across the plan concurrency envelope so
    # concurrent tasks cannot reserve the same money twice.
    concurrency_share = max(1, policy["max_concurrent_tasks"])
    reservation = min(remaining // concurrency_share or remaining, policy["max_task_reservation_paise"])
    task_id = str(uuid4())
    db.add(UsageLog(
        user_id=user.id,
        api_call_type="agent_task",
        cost_rupees=reservation,
        task_id=task_id,
        status="reserved",
    ))
    db.commit()
    return TaskAuthorizeResponse(
        allowed=True,
        plan=plan,
        task_id=task_id,
        budget_rupees=policy["budget_paise"] / 100,
        spent_rupees=spent / 100,
        remaining_rupees=remaining / 100,
        reserved_rupees=reservation / 100,
        task_timeout_seconds=policy["task_timeout_seconds"],
        max_concurrent_tasks=policy["max_concurrent_tasks"],
    )


@router.post("/report-task")
def report_task(request: TaskReportRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Replace the reservation with OpenClaw's recorded run cost."""
    row = db.query(UsageLog).filter(
        UsageLog.user_id == user.id,
        UsageLog.task_id == request.task_id,
        UsageLog.status == "reserved",
    ).with_for_update().first()
    if not row:
        raise HTTPException(status_code=404, detail="Task reservation not found")
    cost_usd = max(0.0, float(request.cost_usd or 0.0))
    if cost_usd > 0:
        actual_paise = int(round(cost_usd * USD_TO_INR * 100))
    elif request.input_tokens is not None or request.output_tokens is not None:
        # Conservative fallback when a provider/runtime omits costUsd.
        # This deliberately overestimates rather than silently undercounting.
        input_tokens = max(0, int(request.input_tokens or 0))
        output_tokens = max(0, int(request.output_tokens or 0))
        fallback_usd = (input_tokens / 1_000_000) * 1.0 + (output_tokens / 1_000_000) * 3.0
        actual_paise = int(round(fallback_usd * USD_TO_INR * 100))
    else:
        # Unknown spend is fail-closed: reserve the task envelope instead of
        # pretending the task was free.
        actual_paise = int(row.cost_rupees)
    if request.status in {"failed", "timeout", "canceled"} and cost_usd <= 0 and request.input_tokens is None and request.output_tokens is None:
        actual_paise = max(actual_paise, int(row.cost_rupees))
    row.cost_rupees = actual_paise
    row.status = "completed" if request.status not in {"canceled", "failed", "timeout"} else request.status
    db.commit()
    return {"status": "recorded", "cost_rupees": actual_paise / 100, "task_id": request.task_id}


@router.get("/stats")
def get_usage_stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UsageResponse:
    plan, policy = _policy_and_subscription(user, db)
    start, end = _period_range(plan)
    spent = _spent_paise(user.id, start, end, db)
    calls = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == user.id,
        UsageLog.created_at >= start,
        UsageLog.created_at < end,
        UsageLog.api_call_type == "agent_task",
    ).scalar() or 0
    remaining = max(0, policy["budget_paise"] - spent)
    return UsageResponse(
        plan=plan,
        period=policy["period"],
        budget_rupees=policy["budget_paise"] / 100,
        spent_rupees=spent / 100,
        remaining_rupees=remaining / 100,
        monthly_limit=-1,
        calls_used=int(calls),
        calls_remaining=-1,
        monthly_cost=0,
        overage_cost=0,
    )


@router.post("/check-limit")
def check_rate_limit(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    plan, policy = _policy_and_subscription(user, db)
    start, end = _period_range(plan)
    spent = _spent_paise(user.id, start, end, db)
    return {
        "allowed": spent < policy["budget_paise"],
        "plan": plan,
        "period": policy["period"],
        "budget_rupees": policy["budget_paise"] / 100,
        "spent_rupees": spent / 100,
        "remaining_rupees": max(0, policy["budget_paise"] - spent) / 100,
        "requests_per_minute": policy["requests_per_minute"],
        "task_timeout_seconds": policy["task_timeout_seconds"],
    }


@router.post("/log-call")
def log_api_call(user: User = Depends(get_current_user), db: Session = Depends(get_db), call_type: str = "skill_execution"):
    # Kept for backward compatibility; real agent tasks use authorize-task/report-task.
    plan, policy = _policy_and_subscription(user, db)
    start, end = _period_range(plan)
    spent = _spent_paise(user.id, start, end, db)
    if spent >= policy["budget_paise"]:
        raise HTTPException(status_code=429, detail=f"Usage budget reached for {plan} plan")
    db.add(UsageLog(user_id=user.id, api_call_type=call_type, cost_rupees=0, status="completed"))
    db.commit()
    return {"status": "logged", "calls_used": 1}
