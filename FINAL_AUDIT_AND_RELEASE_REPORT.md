# DACEXY AI 1.0.1 — Final Hardening Audit

**Date:** 2026-08-22

## Final result

The original audit blockers that were safe to fix without changing the protected desktop agent have been addressed.

### Fixed

- `Payment.updated_at` database/model mismatch → migration `007` added.
- Stale migration-head checks (`005`) → release verifiers now validate the actual head (`007`).
- Paid entitlement leakage after subscription inactivity → centralized effective-plan logic now falls back to Free unless subscription status is `active`.
- Usage/license/auth plan reporting → all use effective entitlements.
- Concurrent signup uniqueness → clean `409` conflict handling.
- Duplicate Razorpay subscription creation → blocked while an existing subscription is active/pending.
- Payment/order mismatch → rejected.
- Subscription lifecycle/license synchronization → activation/resume/charge re-enable; pause/halt/cancel/completion disable.
- Public web claims that exceeded the implementation → reduced to capabilities actually represented by the archive.

## Desktop agent

**FROZEN AS REQUESTED.**

The protected desktop files were not changed. Their SHA-256 values match `DESKTOP_AGENT_UNCHANGED.sha256`.

The installer source was also left untouched. Static inspection confirms the intended Windows installation chain:

`DACEXY installer -> Node.js check/download -> pinned OpenClaw npm install -> version check -> skills -> OpenClaw gateway -> direct OpenClaw Gateway`

The installer uses a user-local prefix:

`%LOCALAPPDATA%\\DACEXY\\npm-global`

and the OpenClaw CLI is verified at the pinned version:

`2026.7.1-2`

The bundled skill destination is:

`%USERPROFILE%\\.openclaw\\workspace\\skills`

with a required minimum of 178 `SKILL.md` files.

## Dynamic bridge test

The unchanged bridge was run locally with a fake `openclaw` executable. A WebSocket client successfully completed:

`connect -> sessions.create -> chat.send -> chat.message -> response`

A malicious `Origin: https://evil.example` connection was rejected with HTTP 403.

This validates the bridge contract and local process invocation path. It does **not** certify Windows installation or a real OpenClaw provider call.

## Verification results

| Check | Result |
|---|---|
| Python syntax | PASS |
| Node bridge syntax | PASS |
| Alembic upgrade | PASS |
| Alembic downgrade | PASS |
| Alembic upgrade again | PASS |
| Migration head | PASS — 007 |
| Model/database schema match | PASS |
| Release verifier | PASS |
| Protected desktop hashes | PASS |
| 178 skills | PASS |
| Bridge E2E | PASS |
| Origin rejection | PASS |
| Full pytest suite | NOT RUN — missing declared packages in audit environment |
| Windows NSIS build | NOT RUN — Windows/NSIS unavailable |
| Real OpenClaw Windows install | NOT RUN — Windows unavailable |
| Real provider request | NOT RUN — credentials/provider unavailable |

## Certification boundary

The platform is a **final hardened release candidate**. The remaining gate is a real clean Windows 10/11 acceptance run using the packaged installer and a real OpenClaw/provider configuration. The archive must not be described as Windows-certified until that test is completed.
