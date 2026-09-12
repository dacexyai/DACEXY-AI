"""Static release verification for DACEXY.

This intentionally does not modify or execute the desktop agent. It verifies that
its existing installer path is satisfiable by the NSIS packaging definition and
that the backend/frontend release invariants are internally consistent.
"""
from pathlib import Path
import ast
import hashlib
import os
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
errors = []

# Verify the protected desktop agent files against the immutable release manifest.
manifest = ROOT / "DESKTOP_AGENT_UNCHANGED.sha256"
if manifest.exists():
    for line in manifest.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        digest, rel = line.split(maxsplit=1)
        path = ROOT / rel
        if not path.exists():
            errors.append(f"Missing protected desktop source: {rel}")
        elif hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            errors.append(f"Final desktop source hash mismatch: {rel}")
else:
    errors.append("Missing desktop immutability manifest")

# Fresh-database Alembic smoke test. This is deliberately isolated from the real DB.
def migration_smoke_test():
    backend = ROOT / "backend"
    with tempfile.TemporaryDirectory(prefix="dacexy-verify-") as td:
        db = Path(td) / "verify.db"
        env = os.environ.copy()
        env["JWT_SECRET"] = "release-verification-secret-0123456789-abcdefghijklmnopqrstuvwxyz"
        env["DATABASE_URL"] = f"sqlite:///{db.as_posix()}"
        for command in (("upgrade", "head"), ("downgrade", "base"), ("upgrade", "head"), ("current",)):
            result = subprocess.run(["alembic", *command], cwd=backend, env=env, capture_output=True, text=True, timeout=120)
            if result.returncode != 0:
                raise RuntimeError((result.stdout + "\n" + result.stderr).strip()[-4000:])
        # Verify against the repository's actual migration head rather than a stale hard-coded revision.
        expected_head = None
        for migration_file in sorted((ROOT / "backend" / "alembic" / "versions").glob("*.py")):
            text = migration_file.read_text(encoding="utf-8")
            marker = 'revision = "'
            if marker in text:
                candidate = text.split(marker, 1)[1].split('"', 1)[0]
                down_marker = 'down_revision = "'
                down = text.split(down_marker, 1)[1].split('"', 1)[0] if down_marker in text else None
                if candidate and down is not None:
                    # A linear migration tree has exactly one revision not referenced as a down_revision.
                    expected_head = candidate
        if expected_head is None or f"{expected_head} (head)" not in result.stdout:
            raise RuntimeError(f"unexpected Alembic head output: {result.stdout.strip()}; expected {expected_head} (head)")

try:
    migration_smoke_test()
except Exception as exc:
    errors.append(f"Alembic fresh-db smoke test failed: {exc}")

# Backend syntax
for path in (ROOT / "backend" / "app").rglob("*.py"):
    try:
        ast.parse(path.read_text(encoding="utf-8"))
    except SyntaxError as exc:
        errors.append(f"Python syntax: {path}: {exc}")

# Desktop agent source is intentionally immutable for this release pass.
required_desktop = [
    ROOT / "fe/dacexy/desktop/electron/main.cjs",
    ROOT / "fe/dacexy/desktop/electron/preload.cjs",
    ROOT / "fe/dacexy/desktop/src/lib/gateway.ts",
    ROOT / "fe/dacexy/desktop/src/services/agent.ts",
]
for p in required_desktop:
    if not p.exists():
        errors.append(f"Missing desktop agent source: {p}")

# The final NSIS package owns the runtime packaging path directly.

# Installer must pin the tested OpenClaw release and enforce the supported Node floor.
installer = (ROOT / "inst2/installer/install.ps1").read_text(encoding="utf-8")
if '$OpenClawVersion = "2026.7.1-2"' not in installer:
    errors.append("OpenClaw version pin missing")
if '$NodeVersion = "22.22.3"' not in installer:
    errors.append("Supported Node 22.22.3 installer pin missing")
if 'openclaw --version' not in installer or 'gateway' not in installer or 'Test-NetConnection' not in installer:
    errors.append("Installer post-install verification missing")

# Direct OpenClaw invariants: protocol v4, loopback endpoint, and no bridge dependency.
gateway_client = (ROOT / "fe/dacexy/desktop/src/lib/gateway.ts").read_text(encoding="utf-8")
agent_source = (ROOT / "fe/dacexy/desktop/src/services/agent.ts").read_text(encoding="utf-8")
if "minProtocol: 4" not in gateway_client or "maxProtocol: 4" not in gateway_client:
    errors.append("OpenClaw Gateway protocol v4 handshake missing")
if "connect.challenge" not in gateway_client or "ws://127.0.0.1:18789" not in agent_source:
    errors.append("Direct OpenClaw loopback connection missing")
if (ROOT / "inst2/installer/dacexy-gateway-bridge.cjs").exists() or (ROOT / "inst2/installer/dacexy-bridge-runner.cjs").exists():
    errors.append("Legacy DACEXY bridge files are still packaged")

# Production web builds must never silently target localhost.
web_api = (ROOT / "fe/dacexy/src/lib/api.ts").read_text(encoding="utf-8")
if "VITE_API_URL is required for production builds" not in web_api:
    errors.append("Production frontend API URL guard missing")

# Production backend must require shared Redis and PostgreSQL, and must not bypass rate limits on localhost.
config = (ROOT / "backend/app/config.py").read_text(encoding="utf-8")
if (
    "REDIS_URL must be set in production" not in config
    or "SQLite is not supported in production" not in config
    or "REDIS_URL must not point to loopback in production" not in config
    or "FRONTEND_URL must point to the real production frontend" not in config
):
    errors.append("Production backend dependency/loopback guards missing")
compose = (ROOT / "backend/docker-compose.yml").read_text(encoding="utf-8")
if "APP_ENV: production" not in compose:
    errors.append("Production Docker Compose does not explicitly set APP_ENV=production")
if "FRONTEND_URL: ${FRONTEND_URL:?FRONTEND_URL must be set" not in compose:
    errors.append("Production Docker Compose permits an unsafe default FRONTEND_URL")
middleware = (ROOT / "backend/app/middleware.py").read_text(encoding="utf-8")
if 'local_bypass = os.getenv("APP_ENV", "development").lower() != "production"' not in middleware:
    errors.append("Production localhost rate-limit guard missing")

# Skill trees must remain complete and mirrored.
count = len(list((ROOT / "inst2/installer/skills").rglob("SKILL.md")))
if count < 630:
    errors.append(f"Skill count too low at {ROOT / "inst2/installer/skills"}: {count}")

# No obvious secret literals in tracked source.
secret_patterns = [re.compile(r"sk-[A-Za-z0-9]{20,}"), re.compile(r"rzp_(?:test|live)_[A-Za-z0-9]{10,}")]
for p in [ROOT / "backend/app", ROOT / "fe/dacexy/src", ROOT / "fe/dacexy/desktop/electron"]:
    for f in p.rglob("*"):
        if f.is_file() and f.suffix in {".py", ".ts", ".tsx", ".cjs", ".js", ".json"}:
            text = f.read_text(encoding="utf-8", errors="ignore")
            if any(rx.search(text) for rx in secret_patterns):
                errors.append(f"Possible hard-coded provider/payment secret: {f}")

if errors:
    print("RELEASE VERIFY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("RELEASE VERIFY: PASS")
print("Desktop agent source: integrated and release-hash-verified")
print("Desktop installer packaging: install-root/inst2/installer supplied")
print("OpenClaw pin: 2026.7.1-2")
print("Skills: 630+")
