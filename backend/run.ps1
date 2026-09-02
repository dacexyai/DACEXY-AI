# DACEXY Backend startup for Windows (dev + prod)
# Usage: .\run.ps1
param([string]$Mode = "dev")

$pythonCmd = if (Get-Command python3 -ErrorAction SilentlyContinue) { "python3" } else { "python" }

if ($Mode -eq "dev") {
  Write-Host "Starting backend in DEV mode (hot reload)..." -ForegroundColor Green
  & $pythonCmd -m venv venv
  & .\venv\Scripts\Activate.ps1
  & $pythonCmd -m pip install -q -r requirements.txt
  & $pythonCmd -m uvicorn app.main:app --reload --port 8000
} else {
  Write-Host "Starting backend in PROD mode..." -ForegroundColor Green
  & $pythonCmd -m pip install -q -r requirements.txt --break-system-packages
  & alembic upgrade head
  if ($LASTEXITCODE -ne 0) { throw "Database migration failed." }
  & $pythonCmd -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
}
