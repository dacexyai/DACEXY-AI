# DACEXY AI 1.0.1 — Final Integrated Platform Package

## What is final in this archive

- DACEXY web platform source is integrated with the desktop agent path.
- Desktop agent connects to `ws://127.0.0.1:18789`.
- The direct OpenClaw Gateway invokes `openclaw agent --agent main`.
- OpenClaw is pinned to `2026.7.1-2`.
- 630 business skills are bundled under `inst2/installer/skills`.
- Windows installer source bundles `inst2/installer` and runs `install.ps1`.
- The installer provisions Node.js, OpenClaw, the Gateway, bridge, skills and watchdog.
- Provider credentials are intentionally not embedded in this archive.
- The landing/download page already references the DACEXY Windows installer asset manifest.

## Verification performed in this environment

PASS:
- `scripts/release_verify.py`
- `scripts/verify_release.py`
- Python syntax validation
- Fresh Alembic upgrade/downgrade/upgrade smoke test, head `007`
- 630 skill count
- Desktop final-source SHA-256 manifest
- Bridge static hardening checks
- NSIS runtime packaging contract
- No generated `.pyc` files left in the release tree

## One certification boundary that cannot be simulated

A Windows 10/11 machine is required for the final binary certification because this environment cannot honestly execute the Windows/NSIS/Electron stack.

The final Windows acceptance must therefore verify:

1. Build the Electron app with the real production `DACEXY_API_URL`.
2. Compile `installer.nsi` with NSIS.
3. Install the resulting `DACEXY-AI-Setup.exe` on a clean Windows machine.
4. Confirm OpenClaw `2026.7.1-2`, 630 skills, Gateway `18789`, bridge `18789`, and scheduled tasks.
5. Configure a funded model-provider credential.
6. Run `openclaw agent --agent main --message "Reply with exactly: DACEXY AGENT TEST OK" --timeout 120`.
7. Open DACEXY AI and send a chat message through the desktop UI.

A provider billing/credit failure is an account/inference gate, not evidence that the installer or bridge is broken.
