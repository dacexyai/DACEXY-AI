# DACEXY AI 1.0.1 — Final Hardening Changelog

Date: 2026-08-22

## Desktop agent freeze

The protected desktop-agent files were not edited:

- `fe/dacexy/desktop/electron/main.cjs`
- `fe/dacexy/desktop/electron/preload.cjs`
- `fe/dacexy/desktop/src/lib/gateway.ts`
- `fe/dacexy/desktop/src/services/agent.ts`

Their SHA-256 values still match `DESKTOP_AGENT_UNCHANGED.sha256`.

## Fixes applied outside the desktop agent

1. Hardened the DACEXY/OpenClaw bridge with session validation.
2. Added session TTL cleanup.
3. Added global and per-session concurrent-agent limits.
4. Prevented stale/unknown session keys from launching OpenClaw processes.
5. Added production frontend protection against accidental localhost API fallback.
6. Added production backend requirements for Redis-backed rate limiting and PostgreSQL.
7. Disabled localhost rate-limit bypass in production.
8. Removed development localhost CORS origins from production.
9. Corrected stale migration-head documentation from 005 to 007.
10. Corrected the web download-section version/installation wording.
11. Updated release verification to check the new hardening invariants.

## OpenClaw installation contract

The installer remains pinned to:

- Node.js `22.22.3` when installation is required
- OpenClaw `2026.7.1-2`
- User-local npm prefix `%LOCALAPPDATA%\\DACEXY\\npm-global`
- OpenClaw Gateway `127.0.0.1:18789`
- DACEXY direct OpenClaw Gateway `127.0.0.1:18789`
- 178 bundled skills under `%USERPROFILE%\\.openclaw\\workspace\\skills`

The installer verifies the installed OpenClaw version and the Node MSI SHA-256 before continuing.

## Validation

- Release verifier: PASS
- Protected desktop hashes: PASS
- Backend Python syntax: PASS
- Alembic fresh DB upgrade/downgrade/upgrade: PASS
- Migration head: 007
- Bridge Node syntax: PASS
- Bridge WebSocket E2E with fake OpenClaw: PASS
- Bridge session validation: PASS
- Malicious Origin rejection: PASS
- 178 skills: PASS

## Remaining certification boundary

A real Windows 10/11 clean-machine run is still required to certify the packaged EXE itself. This environment cannot truthfully claim that it executed the Windows MSI/NSIS installer, installed OpenClaw on Windows, registered Task Scheduler, launched the packaged Electron application, or completed a real provider request.

The local bridge authentication limitation also remains because adding a required authentication token would require changing the frozen desktop gateway client. The bridge remains loopback-only and rejects non-Electron web origins; this release intentionally does not alter the protected client.
