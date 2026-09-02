# DACEXY AI 1.0.1 — Final Windows Acceptance

This archive is the final integrated source release candidate. Windows certification still requires one real Windows 10/11 run.

## 1. Build

Set the production API URL, then run `BUILD_DESKTOP_PRODUCTION.ps1` from the repository root.

## 2. Package

From `fe/dacexy/desktop`, package the Electron app and compile `installer.nsi` with NSIS. The NSIS installer bundles `inst2/installer` and executes `install.ps1`.

## 3. Install

Run the resulting `DACEXY-AI-Setup.exe` on a clean Windows user profile.

## 4. Verify runtime

Run `VERIFY_WINDOWS_AGENT_INSTALL.ps1`. It must report:
- OpenClaw 2026.7.1-2
- at least 630 SKILL.md files
- gateway 127.0.0.1:18789 reachable
- bridge 127.0.0.1:18789 reachable
- scheduled tasks present

## 5. Verify real inference

Configure a funded model-provider credential, then run:

`openclaw agents list`

`openclaw agent --agent main --message "Reply with exactly: DACEXY AGENT TEST OK" --timeout 120`

The expected result is a successful assistant response. A provider billing/credit error is not an installer failure; it is a provider-account failure.

## 6. Verify desktop path

Launch DACEXY AI and send a chat message. The path must be:

`DACEXY Desktop -> ws://127.0.0.1:18789 -> OpenClaw Gateway -> agent main -> configured provider`
