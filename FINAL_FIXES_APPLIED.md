# DACEXY AI — Final Hardening Fixes Applied

Release candidate: 1.0.1 hardened platform
Date: 2026-08-22

## Protected desktop agent

The four protected desktop-agent source files were not modified:

- `fe/dacexy/desktop/electron/main.cjs`
- `fe/dacexy/desktop/electron/preload.cjs`
- `fe/dacexy/desktop/src/lib/gateway.ts`
- `fe/dacexy/desktop/src/services/agent.ts`

Their SHA-256 values still match `DESKTOP_AGENT_UNCHANGED.sha256`.

## Backend/platform fixes

1. Added migration `007_add_updated_at_to_payments.py` so the production schema matches `Payment.updated_at`.
2. Added a single entitlement module and applied it to usage, license verification, and authenticated user plan reporting.
3. Inactive paid subscriptions now fall back to Free limits/entitlements.
4. Added signup handling for concurrent unique-email conflicts.
5. Prevented duplicate active/pending Razorpay subscription creation.
6. Added payment/order mismatch protection.
7. Synchronized license activation state with authoritative subscription lifecycle events.
8. Removed stale hard-coded migration-head assumptions from both release verifiers.
9. Added entitlement tests.
10. Removed web marketing claims for features not implemented in this archive.

## Desktop/OpenClaw

No desktop source or installer source was changed in this final pass.

Static verification confirms that the existing installer downloads/installs the pinned OpenClaw runtime into the per-user `%LOCALAPPDATA%\\DACEXY\\npm-global` prefix, verifies the version, installs 178 skills, and starts the direct OpenClaw Gateway on the expected loopback ports.

A Linux E2E test also exercised the unchanged direct OpenClaw Gateway against a fake `openclaw` executable and completed `connect -> sessions.create -> chat.send -> chat.message` successfully. A malicious Origin was rejected with HTTP 403.

## Release verification

- `scripts/release_verify.py`: PASS
- `scripts/verify_release.py`: PASS
- Alembic head: `007 (head)`
- Model/database schema comparison: PASS
- Protected desktop hashes: PASS
- Backend syntax: PASS
- Bridge syntax: PASS
- 178 skills: PASS

## Remaining certification boundary

The real Windows installer and real OpenClaw/provider execution cannot be certified from this Linux environment. Use `VERIFY_WINDOWS_AGENT_INSTALL.ps1` on a clean Windows machine after installing the packaged application to perform the Windows runtime acceptance check.
