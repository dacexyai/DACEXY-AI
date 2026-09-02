# DACEXY 1.0.2 — Direct OpenClaw Backend Handshake Fix

DACEXY is a same-machine desktop control-plane client. It connects to the loopback OpenClaw Gateway using the reserved backend identity:

- `client.id = gateway-client`
- `client.mode = backend`
- `role = operator`
- scopes: `operator.read`, `operator.write`
- authentication: the Gateway shared token/password from the environment or local OpenClaw config

This path intentionally does not create or reuse a DACEXY device-pairing token. OpenClaw documents the direct-loopback `gateway-client` backend path as a trusted local helper flow, so users do not need to pair a new DACEXY device after every reinstall, update, or Gateway restart.

The Gateway keeps its normal authentication and loopback security. DACEXY does not disable device authentication globally and does not expose the Gateway remotely.
