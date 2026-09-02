# DACEXY integration work completed

The desktop client is wired to the existing local DACEXY runtime.

Runtime path: DACEXY AI.exe → ws://127.0.0.1:18789 → direct OpenClaw Gateway → `openclaw agent --agent main` → configured provider.

Changes:
- Desktop chat ensures the gateway connection before each request.
- Desktop app attempts the local gateway connection on startup.
- Chat errors are shown in the conversation.
- Agent Hub Connect performs a real gateway connection.
- Agent Hub documents the real local OpenClaw Gateway endpoint.
- NSIS bundles `inst2` and runs `inst2/installer/install.ps1` during installation.

Release gate: the Windows packaged EXE must still be built/tested on Windows, and a funded provider request is required for final real-provider certification.
