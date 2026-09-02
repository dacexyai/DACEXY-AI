#!/bin/bash
set -e
MODE=${1:-dev}
PYTHON=$(command -v python3 || command -v python)

if [ "$MODE" = "dev" ]; then
  echo "Starting backend in DEV mode (hot reload)..."
  python -m venv venv
  source venv/bin/activate
  pip install -q -r requirements.txt
  python -m uvicorn app.main:app --reload --port 8000
else
  echo "Starting backend in PROD mode..."
  pip install -q -r requirements.txt
  alembic upgrade head
  python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
fi
