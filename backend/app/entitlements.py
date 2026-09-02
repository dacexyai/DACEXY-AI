"""Single source of truth for subscription entitlements."""

PLAN_ALIASES = {"starter": "free", "pro": "business", "premium": "enterprise"}
VALID_PLANS = {"free", "business", "enterprise"}
PAID_PLANS = {"business", "enterprise"}


def canonical_plan(plan: str | None) -> str:
    value = (plan or "free").strip().lower()
    value = PLAN_ALIASES.get(value, value)
    return value if value in VALID_PLANS else "free"


def effective_plan(subscription) -> str:
    """Return the plan the account is actually entitled to right now.

    A canceled/paused/past-due paid subscription never retains paid limits.
    """
    if subscription is None or subscription.status != "active":
        return "free"
    return canonical_plan(subscription.plan)


def has_paid_entitlement(subscription) -> bool:
    return effective_plan(subscription) in PAID_PLANS
