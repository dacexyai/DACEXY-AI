# DACEXY AI Desktop 1.0.2 — Direct OpenClaw Connection

This desktop app connects **directly** from DACEXY to the user's local OpenClaw Gateway WebSocket. There is no DACEXY Brize process and no cloud bridge in the chat path.

## Connection

- Gateway URL: `ws://127.0.0.1:18789`
- Protocol: OpenClaw Gateway protocol v4
- Client identity: `client.id = gateway-client`, `client.mode = backend`
- Role: `operator`
- Scopes: `operator.read`, `operator.write`
- Authentication: automatically reads `OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`, or the local `~/.openclaw/openclaw.json` gateway auth token/password when it is a normal string credential.
- The credential is sent only in the Gateway WebSocket handshake. It is not sent to the DACEXY cloud backend.

OpenClaw requires Gateway authentication by default, including for loopback connections. A healthy `127.0.0.1:18789` port alone is therefore not enough: the desktop client must authenticate the WebSocket handshake.

If the Gateway uses a SecretRef or an ephemeral runtime token, configure a stable token or provide the token through `OPENCLAW_GATEWAY_TOKEN` for the desktop process. OpenClaw documents `openclaw gateway auth-token --show` as the interactive way to retrieve a configured token.

## Electron launcher

`START-DACEXY-FIXED.ps1` builds the renderer when necessary, repairs the Electron executable from the local Electron cache when the npm shim has no extracted binary, and launches Electron directly.

## Security

- Chromium renderer uses `contextIsolation: true` and `nodeIntegration: false`.
- Shell execution is disabled unless `DACEXY_DEV_AGENT=1` is explicitly set.
- The cloud backend does not proxy OpenClaw traffic.
- Gateway access remains loopback-only by default.
