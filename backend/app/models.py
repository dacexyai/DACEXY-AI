import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, Integer
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def gen_id() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    company = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    subscription = relationship("Subscription", back_populates="user", uselist=False)
    license = relationship("License", back_populates="user", uselist=False)


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    plan = Column(String, default="free")  # free | business | enterprise
    pending_plan = Column(String, nullable=True)  # requested recurring plan; activated only after Razorpay confirmation
    status = Column(String, default="active")  # active | past_due | canceled
    razorpay_customer_id = Column(String, nullable=True)
    razorpay_subscription_id = Column(String, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="subscription")


class License(Base):
    """A license key the desktop app exchanges to unlock the agent + business skills.
    The cloud backend never talks to the user's local Gateway directly (it binds to
    loopback on their machine by design) — the desktop app validates this key against
    the backend, then talks directly to the local OpenClaw Gateway at ws://127.0.0.1:18789."""

    __tablename__ = "licenses"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    last_seen_at = Column(DateTime, nullable=True, index=True)
    machine_id = Column(String, nullable=True)  # bound on first activation

    user = relationship("User", back_populates="license")


class Payment(Base):
    """Razorpay payment record for audit and webhook verification."""

    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    razorpay_payment_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    amount = Column(Integer, nullable=False)  # in paise (e.g., 200000 for ₹2000.00)
    currency = Column(String(3), default="INR")
    status = Column(String, default="pending", index=True)  # pending | success | failed | captured
    signature = Column(String, nullable=True)  # Razorpay signature for verification
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User")


class UsageLog(Base):
    """Track API calls for usage-based billing."""
    
    __tablename__ = "usage_logs"
    
    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    api_call_type = Column(String, nullable=False)  # skill_execution, chat, etc
    cost_rupees = Column(Integer, default=0)  # cost in paise
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class RefreshSession(Base):
    __tablename__ = "refresh_sessions"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    jti = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False, index=True)
    revoked_at = Column(DateTime, nullable=True, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = relationship("User")


class WebhookEvent(Base):
    """Persisted Razorpay webhook idempotency record."""

    __tablename__ = "webhook_events"

    id = Column(String, primary_key=True, default=gen_id)
    event_id = Column(String(128), unique=True, nullable=False, index=True)
    event_type = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)


class AdvisorMessage(Base):
    """Persistent Business Advisor conversation memory for each user."""

    __tablename__ = "advisor_messages"

    id = Column(String, primary_key=True, default=gen_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String, nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    user = relationship("User")
