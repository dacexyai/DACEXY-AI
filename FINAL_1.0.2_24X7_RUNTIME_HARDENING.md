# DACEXY AI 1.0.2 — 24/7 Runtime Hardening

This release package is based on the uploaded DACEXY-AI-1.0.2-SILENT-24x7-FINAL archive. The Windows installer runtime layer has been hardened with two dedicated watchdog tasks:

- `OpenClaw Gateway Watchdog`: continuously checks 127.0.0.1:18789, first requests the managed Gateway task, then falls back to `%USERPROFILE%\.openclaw\gateway.cmd` if the port remains unavailable.
- `direct OpenClaw Gateway Watchdog`: continuously checks 127.0.0.1:18789 and restarts the bundled bridge supervisor when needed.

The installer no longer relies on a single one-minute combined watchdog for recovery.

Important: this archive contains the hardened release package, but a final production claim still requires running the installer and crash-recovery tests on the target Windows machine.
