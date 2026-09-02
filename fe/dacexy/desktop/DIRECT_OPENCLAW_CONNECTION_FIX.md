# Direct OpenClaw connection

DACEXY uses Electron main-process IPC for OpenClaw. The renderer never opens a WebSocket to OpenClaw. The main process performs the WebSocket upgrade, sends the gateway credential during the v4 connect handshake, and uses a loopback Origin (`http://127.0.0.1:18789`) accepted by OpenClaw loopback policy. No DACEXY Brize/compatibility bridge is used.
