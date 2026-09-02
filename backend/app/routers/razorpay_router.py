"""Razorpay billing integration with enhanced security."""

import hashlib
import hmac
import json
import logging
from typing import Optional
from uuid import uuid4
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Query, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.auth import get_current_user
from app.config import settings
from app.db import get_db
from app.models import User, Subscription, Payment, License, WebhookEvent

logger = logging.getLogger(__name__)

try:
    import razorpay
except ImportError:
    razorpay = None

router = APIRouter(prefix="/api/v1/billing", tags=["billing"])

# Webhook idempotency is persisted in PostgreSQL/SQLite via WebhookEvent.


class CreateOrderRequest(BaseModel):
    plan: str  # "business" or "enterprise"


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


class VerifyPaymentResponse(BaseModel):
    success: bool
    message: str
    license_key: Optional[str] = None


class UsageLimitModel(BaseModel):
    """Usage limits per plan."""
    plan: str
    monthly_api_calls: int  # -1 = unlimited
    max_concurrent_agents: int
    cost_per_excess_api_call: float  # rupees


USAGE_LIMITS = {
    "free": UsageLimitModel(plan="free", monthly_api_calls=100, max_concurrent_agents=1, cost_per_excess_api_call=30.0),
    "business": UsageLimitModel(plan="business", monthly_api_calls=50000, max_concurrent_agents=5, cost_per_excess_api_call=250.0),
    "enterprise": UsageLimitModel(plan="enterprise", monthly_api_calls=-1, max_concurrent_agents=-1, cost_per_excess_api_call=1000.0),
}


class PaginatedPaymentsResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    total_pages: int


def _verify_razorpay_signature(order_id: str, payment_id: str, signature: str) -> bool:
    """Verify Razorpay payment signature."""
    message = f"{order_id}|{payment_id}"
    digest = hmac.new(
        settings.razorpay_key_secret.encode(),
        message.encode(),
        digestmod=hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(digest, signature)


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(request: CreateOrderRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a Razorpay order for payment."""
    
    plan_aliases = {"starter": "free", "pro": "business", "premium": "enterprise"}
    canonical_plan = plan_aliases.get(request.plan, request.plan)
    if canonical_plan not in {"free", "business", "enterprise"}:
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Free tier never touches Razorpay.
    if canonical_plan == "free":
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if not subscription:
            subscription = Subscription(user_id=user.id)
            db.add(subscription)
        subscription.plan = "free"
        subscription.status = "active"
        db.commit()
        raise HTTPException(status_code=400, detail="Free is free; no Razorpay order is required")

    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(status_code=503, detail="Billing is not configured")
    
    # Plan pricing (in paise) - Updated per requirement
    # Free: ₹0 · Business: ₹2000 · Enterprise: ₹10000
    plans = {
        "business": {"amount": 200000, "description": "DACEXY Business - ₹2000/month"},
        "enterprise": {"amount": 1000000, "description": "DACEXY Enterprise - ₹10000/month"},
    }
    plan = plans[canonical_plan]
    
    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        
        order_data = {
            "amount": plan["amount"],
            "currency": "INR",
            "receipt": f"dacexy-{user.id[:8]}-{uuid4().hex[:16]}",
            "description": plan["description"],
            "customer_notify": 1,  # notify customer
            "notes": {
                "user_id": user.id,
                "user_email": user.email,
                "plan": canonical_plan
            }
        }
        
        order = client.order.create(data=order_data)
        
        return CreateOrderResponse(
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            key_id=settings.razorpay_key_id
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")




class CreateSubscriptionRequest(BaseModel):
    plan: str  # business or enterprise


class CreateSubscriptionResponse(BaseModel):
    subscription_id: str
    plan: str
    key_id: str


@router.post("/create-subscription", response_model=CreateSubscriptionResponse)
def create_subscription(request: CreateSubscriptionRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a real recurring Razorpay subscription using a pre-created Razorpay plan."""
    if request.plan not in {"business", "enterprise"}:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    if not settings.razorpay_key_id or not settings.razorpay_key_secret:
        raise HTTPException(status_code=503, detail="Billing is not configured")

    plan_id = settings.razorpay_plan_business if request.plan == "business" else settings.razorpay_plan_enterprise
    if not plan_id:
        raise HTTPException(
            status_code=503,
            detail=f"Razorpay plan ID for {request.plan} is not configured. Set RAZORPAY_PLAN_{request.plan.upper()}."
        )

    try:
        existing = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if existing and existing.razorpay_subscription_id and existing.status in {"active", "paused", "past_due"}:
            raise HTTPException(status_code=409, detail="An existing Razorpay subscription must be canceled before starting another one")
        if existing and existing.pending_plan:
            raise HTTPException(status_code=409, detail="A subscription checkout is already pending")

        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        subscription = client.subscription.create(data={
            "plan_id": plan_id,
            "total_count": 120,
            "customer_notify": 1,
            "notes": {"user_id": user.id, "user_email": user.email, "plan": request.plan},
        })
        local = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        if not local:
            local = Subscription(user_id=user.id, plan="free", status="active")
            db.add(local)
        # Creating checkout is not proof of payment. Keep the current entitlement
        # unchanged until Razorpay sends an authoritative activated/charged event.
        local.pending_plan = request.plan
        local.razorpay_subscription_id = subscription["id"]
        db.commit()
        return CreateSubscriptionResponse(subscription_id=subscription["id"], plan=request.plan, key_id=settings.razorpay_key_id)
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Failed to create Razorpay subscription: {e}")


@router.post("/verify-payment", response_model=VerifyPaymentResponse)
def verify_payment(
    request: VerifyPaymentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment and activate subscription."""
    
    if not settings.razorpay_key_secret:
        raise HTTPException(status_code=503, detail="Billing is not configured")
    
    # Verify signature
    if not _verify_razorpay_signature(
        request.razorpay_order_id,
        request.razorpay_payment_id,
        request.razorpay_signature
    ):
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    
    try:
        client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))
        payment = client.payment.fetch(request.razorpay_payment_id)
        if payment["status"] != "captured":
            raise HTTPException(status_code=400, detail="Payment not captured")
        if payment.get("order_id") and payment.get("order_id") != request.razorpay_order_id:
            raise HTTPException(status_code=400, detail="Payment does not belong to the supplied order")

        order = client.order.fetch(request.razorpay_order_id)
        if order.get("status") not in {"created", "attempted", "paid"}:
            raise HTTPException(status_code=400, detail="Invalid Razorpay order state")
        if payment.get("amount") != order.get("amount") or payment.get("currency") != order.get("currency"):
            raise HTTPException(status_code=400, detail="Payment amount/currency does not match the Razorpay order")
        order_notes = order.get("notes", {}) or {}
        if order_notes.get("user_id") and order_notes.get("user_id") != user.id:
            raise HTTPException(status_code=403, detail="Payment order does not belong to this account")
        requested_plan = order_notes.get("plan")
        if requested_plan not in {"business", "enterprise"}:
            raise HTTPException(status_code=400, detail="Payment order has no valid plan metadata")
        expected_amounts = {"business": 200000, "enterprise": 1000000}
        if order.get("amount") != expected_amounts[requested_plan] or order.get("currency") != "INR":
            raise HTTPException(status_code=400, detail="Order amount does not match the selected plan")

        # Record payment
        payment_record = db.query(Payment).filter(
            Payment.razorpay_payment_id == request.razorpay_payment_id
        ).first()
        
        if payment_record and payment_record.razorpay_order_id != request.razorpay_order_id:
            raise HTTPException(status_code=409, detail="Payment is already associated with another order")
        if not payment_record:
            payment_record = Payment(
                user_id=user.id,
                razorpay_payment_id=request.razorpay_payment_id,
                razorpay_order_id=request.razorpay_order_id,
                amount=payment["amount"],
                currency=payment["currency"],
                status="success",
                signature=request.razorpay_signature
            )
            db.add(payment_record)
        
        # Update or create subscription
        subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
        
        if not subscription:
            subscription = Subscription(
                user_id=user.id,
                plan=requested_plan,
                status="active",
                razorpay_customer_id=payment.get("customer_id"),
                razorpay_subscription_id=None
            )
            db.add(subscription)
        else:
            subscription.status = "active"
            subscription.plan = requested_plan
            subscription.razorpay_customer_id = payment.get("customer_id")
        
        # Ensure license exists and is active
        license = db.query(License).filter(License.user_id == user.id).first()
        if license:
            license.active = True
        
        db.commit()
        
        license_key = license.key if license else "NOT_FOUND"
        
        return VerifyPaymentResponse(
            success=True,
            message="Payment verified and subscription activated",
            license_key=license_key
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    """Handle Razorpay webhooks with atomic idempotency and retry-safe capture."""
    if not settings.razorpay_webhook_secret:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    signature = request.headers.get("X-Razorpay-Signature")
    if not signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    body = await request.body()
    digest = hmac.new(settings.razorpay_webhook_secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(digest, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    webhook_id = request.headers.get("X-Razorpay-Event-Id") or hashlib.sha256(body).hexdigest()
    try:
        event = json.loads(body)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid webhook JSON") from exc

    event_type = event.get("event") or "unknown"

    # Claim the event BEFORE external side effects. The unique DB constraint makes
    # concurrent deliveries converge on a single processor. If processing fails,
    # the transaction is rolled back and Razorpay can safely retry.
    if db.query(WebhookEvent).filter(WebhookEvent.event_id == webhook_id).first():
        return {"status": "ok", "idempotent": True}
    try:
        db.add(WebhookEvent(event_id=webhook_id, event_type=event_type))
        db.flush()
    except IntegrityError:
        db.rollback()
        return {"status": "ok", "idempotent": True}

    try:
        subscription_events = {
            "subscription.activated": "active",
            "subscription.charged": "active",
            "subscription.resumed": "active",
            "subscription.paused": "paused",
            "subscription.halted": "past_due",
            "subscription.cancelled": "canceled",
            "subscription.completed": "canceled",
        }

        if event_type in subscription_events:
            data = event.get("payload", {}).get("subscription", {}).get("entity", {})
            rp_sub_id = data.get("id")
            if rp_sub_id:
                subscription = db.query(Subscription).filter(
                    Subscription.razorpay_subscription_id == rp_sub_id
                ).first()
                if subscription:
                    subscription.status = subscription_events[event_type]
                    if event_type in {"subscription.activated", "subscription.charged", "subscription.resumed"}:
                        license = db.query(License).filter(License.user_id == subscription.user_id).first()
                        if license:
                            license.active = True
                    if event_type in {"subscription.paused", "subscription.halted"}:
                        license = db.query(License).filter(License.user_id == subscription.user_id).first()
                        if license:
                            license.active = False
                    if event_type == "subscription.activated":
                        # The requested plan is stored separately until Razorpay confirms
                        # activation. This prevents a checkout from granting paid access
                        # while still allowing the authoritative activation webhook to
                        # promote the canonical entitlement.
                        requested_plan = subscription.pending_plan or (data.get("notes", {}) or {}).get("plan")
                        if requested_plan in {"business", "enterprise"}:
                            subscription.plan = requested_plan
                            subscription.pending_plan = None
                    current_end = data.get("current_end")
                    if current_end:
                        subscription.current_period_end = datetime.fromtimestamp(current_end, tz=timezone.utc)
                    if event_type in {"subscription.cancelled", "subscription.completed"}:
                        subscription.pending_plan = None
                        license = db.query(License).filter(License.user_id == subscription.user_id).first()
                        if license:
                            license.active = False

        elif event_type in {"payment.authorized", "payment.captured"}:
            payment_data = event.get("payload", {}).get("payment", {}).get("entity", {})
            payment_id = payment_data.get("id")
            order_id = payment_data.get("order_id")
            subscription_id = payment_data.get("subscription_id")
            if not payment_id:
                raise ValueError("Webhook payment is missing payment id")

            client = razorpay.Client(auth=(settings.razorpay_key_id, settings.razorpay_key_secret))

            # Recurring Razorpay subscription charges may not contain an order_id.
            # They are reconciled through the local subscription record instead of
            # being forced through the one-time order path.
            if not order_id and subscription_id:
                subscription = db.query(Subscription).filter(
                    Subscription.razorpay_subscription_id == subscription_id
                ).first()
                if not subscription:
                    raise ValueError("Unknown Razorpay subscription")
                current_payment = client.payment.fetch(payment_id)
                if current_payment.get("status") == "authorized":
                    amount = int(current_payment.get("amount", 0))
                    client.payment.capture(payment_id, amount)
                    current_payment = client.payment.fetch(payment_id)
                if current_payment.get("status") != "captured":
                    raise RuntimeError("Subscription payment did not reach captured state")
                subscription.status = "active"
                license = db.query(License).filter(License.user_id == subscription.user_id).first()
                if license:
                    license.active = True
                db.commit()
                return {"status": "ok", "event": event_type, "subscription": True}

            if not order_id:
                raise ValueError("Webhook payment is missing order id")

            order = client.order.fetch(order_id)
            notes = order.get("notes", {}) or {}
            user_id = notes.get("user_id") or payment_data.get("notes", {}).get("user_id")
            requested_plan = notes.get("plan") or payment_data.get("notes", {}).get("plan")
            expected_amounts = {"business": 200000, "enterprise": 1000000}
            if user_id not in {str(x.id) for x in db.query(User).filter(User.id == user_id).all()}:
                raise ValueError("Webhook order has invalid user metadata")
            if requested_plan not in expected_amounts:
                raise ValueError("Webhook order has invalid plan metadata")
            if order.get("amount") != expected_amounts[requested_plan] or order.get("currency") != "INR":
                raise ValueError("Webhook order amount/currency mismatch")
            if int(payment_data.get("amount", 0)) != int(order.get("amount", 0)):
                raise ValueError("Webhook payment amount mismatch")

            # Fetch the authoritative payment state first. A retry after a successful
            # capture must not call capture() again.
            current_payment = client.payment.fetch(payment_id)
            if current_payment.get("status") not in {"captured", "authorized"}:
                raise ValueError(f"Payment is not capturable: {current_payment.get('status')}")
            if current_payment.get("status") == "authorized":
                client.payment.capture(payment_id, int(order["amount"]))
                current_payment = client.payment.fetch(payment_id)
            if current_payment.get("status") != "captured":
                raise RuntimeError("Razorpay payment capture did not reach captured state")

            payment_record = db.query(Payment).filter(Payment.razorpay_payment_id == payment_id).first()
            if not payment_record:
                payment_record = Payment(
                    user_id=user_id,
                    razorpay_payment_id=payment_id,
                    razorpay_order_id=order_id,
                    amount=int(order["amount"]),
                    currency=order["currency"],
                    status="captured",
                )
                db.add(payment_record)
            else:
                payment_record.status = "captured"
                payment_record.amount = int(order["amount"])
                payment_record.currency = order["currency"]

            subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
            if not subscription:
                subscription = Subscription(user_id=user_id)
                db.add(subscription)
            subscription.plan = requested_plan
            subscription.status = "active"

            license = db.query(License).filter(License.user_id == user_id).first()
            if license:
                license.active = True

        db.commit()
        return {"status": "ok", "event": event_type}
    except Exception as exc:
        db.rollback()
        logger.exception("Webhook processing failed for %s: %s", webhook_id, exc)
        raise HTTPException(status_code=503, detail="Webhook processing failed; retry safely") from exc


@router.get("/payment-status/{order_id}")
def get_payment_status(order_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Check payment status for polling (after Razorpay redirect)."""
    payment = db.query(Payment).filter(
        Payment.razorpay_order_id == order_id,
        Payment.user_id == user.id
    ).first()
    
    if not payment:
        return {"status": "pending", "captured": False}
    
    return {
        "status": payment.status,
        "captured": payment.status in ("captured", "success"),
        "amount": payment.amount,
        "currency": payment.currency
    }


@router.get("/portal")
def billing_portal(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get Razorpay customer portal (if implemented by Razorpay)."""
    
    subscription = db.query(Subscription).filter(Subscription.user_id == user.id).first()
    
    if not subscription or not subscription.razorpay_customer_id:
        raise HTTPException(status_code=404, detail="No active subscription")
    
    # For now, return a message directing users to Razorpay dashboard
    return {
        "message": "Visit Razorpay dashboard to manage your subscription",
        "customer_id": subscription.razorpay_customer_id
    }


@router.get("/payments", response_model=PaginatedPaymentsResponse)
def list_payments(
    user: User = Depends(get_current_user), 
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100)
):
    """List user payments with pagination."""
    offset = (page - 1) * page_size
    
    # Get total count
    total = db.query(Payment).filter(Payment.user_id == user.id).count()
    
    # Get paginated results
    payments = db.query(Payment)\
        .filter(Payment.user_id == user.id)\
        .order_by(Payment.created_at.desc())\
        .offset(offset)\
        .limit(page_size)\
        .all()
    
    total_pages = (total + page_size - 1) // page_size
    
    return PaginatedPaymentsResponse(
        items=payments,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )
