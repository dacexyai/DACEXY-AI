# DACEXY Desktop Agent Verification

## Scope

The protected `fe/dacexy/desktop` source was intentionally **not modified** in the final hardening pass.

## Static verification

- Electron main process: present.
- Preload bridge: present.
- Windows NSIS script: present.
- OpenClaw check IPC: present.
- Installer IPC: present.
- Existing desktop Gateway client points to `ws://127.0.0.1:18789`.
- `DESKTOP_AGENT_UNCHANGED.sha256` matches all protected desktop source files.

## Installer/OpenClaw path

The unchanged Electron main process resolves `<install root>\\inst2\\installer\\install.ps1`. The NSIS package contains the `inst2/installer` tree at that exact installed path.

The PowerShell installer:

- checks/installs supported Node.js;
- verifies the pinned Node MSI SHA-256;
- installs `openclaw@2026.7.1-2` into a user-writable `%LOCALAPPDATA%\\DACEXY\\npm-global` prefix;
- adds that prefix to the user's PATH;
- verifies `openclaw --version`;
- configures the provider only when a user-supplied key is present;
- installs and verifies 178 bundled business skills;
- installs/restarts the OpenClaw Gateway directly on loopback port `18789`; and
- starts the DACEXY direct OpenClaw Gateway on loopback port `18789`.

## Bridge execution test

The direct OpenClaw Gateway was executed in this Linux audit environment with a fake local `openclaw` executable. A real WebSocket client using the same message contract as the desktop client successfully completed:

`connect -> sessions.create -> chat.send -> chat.message -> chat.send response`

Result: **PASS**.

This proves the bridge contract and local OpenClaw process invocation path work in the tested environment. It does **not** prove the packaged Windows installer, Electron runtime, Windows Task Scheduler registration, or a real OpenClaw provider request.

## Windows certification limitation

A real Windows 10/11 clean-machine test remains required to certify:

`DACEXY-AI-Setup.exe -> install -> Node -> OpenClaw -> Gateway -> skills -> bridge -> Electron desktop -> real provider response`

The desktop source remains frozen as requested.
