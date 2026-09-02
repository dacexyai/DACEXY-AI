# DACEXY 1.0.2 — Direct OpenClaw 24x7 Runtime

Architecture:

`DACEXY Desktop -> ws://127.0.0.1:18789 -> OpenClaw Gateway -> main agent -> configured provider`

There is **no DACEXY compatibility bridge**, bridge runner, or bridge watchdog in this release.

## Runtime
- OpenClaw pinned to `2026.7.1-2`.
- Gateway loopback port: `18789`.
- Gateway bind: `loopback` only.
- Gateway auth: `none` for the private same-machine loopback deployment.
- OpenClaw Gateway is installed as the managed 24x7 runtime.
- DACEXY adds one hidden Gateway watchdog for recovery.
- Legacy bridge tasks/processes are removed by the installer.

## Desktop connection
The DACEXY desktop client speaks OpenClaw Gateway protocol v4 directly, including the `connect.challenge` handshake, `sessions.create`, `chat.send`, streamed `chat` deltas, and final/error states.

## Verification
The included release verifier passes static release checks, including the pinned OpenClaw version, 630+ skills, protocol-v4 client, direct loopback endpoint, and absence of packaged bridge files.

A real Windows acceptance run is still required on the target machine because this Linux build environment cannot start the Windows Scheduled Tasks, Electron desktop build, or the user's configured provider account.
