# Direct OpenClaw connection

DACEXY uses Electron main-process IPC for OpenClaw. The renderer never opens a WebSocket to OpenClaw. The main process performs the WebSocket upgrade and sends the shared Gateway credential during the connect handshake.

The desktop client uses OpenClaw's reserved same-machine backend identity (`gateway-client` / `backend`) on `ws://127.0.0.1:18789`. No DACEXY Brize/compatibility bridge is used. No persistent DACEXY device-pairing step is required for this local backend connection.
