# DACEXY AI 1.0.1 — Final Integrated Release Notes

## Agent

The working OpenClaw-based agent package was integrated into the hardened DACEXY platform. Its 630 business skills are now bundled and verified by both release checks.

The desktop client was upgraded for reliable connection lifecycle behavior and synchronized to version 1.0.1.

## Installer

- Node.js 22.22.3 with SHA-256 verification.
- OpenClaw pinned to 2026.7.1-2.
- No provider API key is embedded in the installer.
- 630 skills installed and verified.
- direct OpenClaw Gateway starts on 127.0.0.1:18789.
- OpenClaw Gateway uses loopback port 18789 directly.
- Uninstall is scoped to DACEXY-managed resources.

## Validation

Both release verifiers pass. Backend syntax and migration smoke tests pass. The bridge was exercised end-to-end against a fake OpenClaw executable.

## Remaining gate

Windows clean-machine acceptance of the packaged EXE is still required before claiming complete Windows production certification.
