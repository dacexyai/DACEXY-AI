# DACEXY 1.0.1 Production Build Requirements

## Desktop agent preservation
The four protected desktop source files are intentionally unchanged:
- `fe/dacexy/desktop/electron/main.cjs`
- `fe/dacexy/desktop/electron/preload.cjs`
- `fe/dacexy/desktop/src/lib/gateway.ts`
- `fe/dacexy/desktop/src/services/agent.ts`

`DESKTOP_AGENT_UNCHANGED.sha256` must continue to match before packaging.

## Production desktop API
The untouched desktop source supports Vite's `VITE_API_URL`. Never ship a production build with its localhost fallback. Build it with:

```powershell
$env:DACEXY_API_URL='https://YOUR-PRODUCTION-API-HOST'
.\BUILD_DESKTOP_PRODUCTION.ps1
```

The script refuses localhost/loopback endpoints.

## Windows runtime verification
After installing the NSIS package on a clean Windows machine, run:

```powershell
.\VERIFY_WINDOWS_AGENT_INSTALL.ps1
```

It verifies the user-local OpenClaw CLI, pinned version `2026.7.1-2`, 630+ skills, gateway port `18789`.
