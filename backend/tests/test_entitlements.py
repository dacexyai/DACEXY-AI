from types import SimpleNamespace

from app.entitlements import canonical_plan, effective_plan, has_paid_entitlement


def test_canonical_plan_aliases_and_unknowns():
    assert canonical_plan("pro") == "business"
    assert canonical_plan("premium") == "enterprise"
    assert canonical_plan("unknown") == "free"


def test_inactive_paid_subscription_falls_back_to_free():
    sub = SimpleNamespace(plan="business", status="canceled")
    assert effective_plan(sub) == "free"
    assert has_paid_entitlement(sub) is False


def test_active_paid_subscription_is_entitled():
    sub = SimpleNamespace(plan="enterprise", status="active")
    assert effective_plan(sub) == "enterprise"
    assert has_paid_entitlement(sub) is True
