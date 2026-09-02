# DACEXY 1.0.2 — Direct OpenClaw Device-Auth Fix

This build fixes `DEVICE_AUTH_SIGNATURE_INVALID` / `device-signature` by implementing the OpenClaw Gateway v3 device-auth handshake used by current OpenClaw clients.

- waits for `connect.challenge`
- uses the challenge nonce and timestamp
- creates/persists an Ed25519 device identity
- derives device id as SHA-256(raw Ed25519 public key)
- sends the canonical raw public key as base64url
- signs the exact v3 payload with the same auth token sent in `auth.token`
- includes `platform` and `deviceFamily`
- keeps the Gateway loopback-only
- does not disable OpenClaw device authentication
