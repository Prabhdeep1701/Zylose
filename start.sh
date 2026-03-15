#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PY_AGENT_DIR="$ROOT_DIR/python-agent"
PY_VENV_DIR="$PY_AGENT_DIR/.venv"

FRONTEND_PORT="${FRONTEND_PORT:-3000}"
AGENT_INTERVAL="${AGENT_INTERVAL:-5}"
BACKEND_ENDPOINT="${BACKEND_ENDPOINT:-http://localhost:${FRONTEND_PORT}}"

log() {
  printf '[zylose-start] %s\n' "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    log "Missing required command: $1"
    exit 1
  fi
}

find_python() {
  if command -v python3 >/dev/null 2>&1; then
    echo "python3"
    return
  fi
  if command -v python >/dev/null 2>&1; then
    echo "python"
    return
  fi

  log "Python is required but not found in PATH."
  exit 1
}

cleanup() {
  log "Stopping services..."

  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ -n "${AGENT_PID:-}" ]] && kill -0 "$AGENT_PID" 2>/dev/null; then
    kill "$AGENT_PID" 2>/dev/null || true
  fi

  wait >/dev/null 2>&1 || true
  log "All services stopped."
}

trap cleanup EXIT INT TERM

require_cmd npm
PYTHON_BIN="$(find_python)"

log "Project root: $ROOT_DIR"

if [[ ! -d "$ROOT_DIR/node_modules" ]]; then
  log "Installing frontend dependencies (npm install)..."
  (cd "$ROOT_DIR" && npm install)
fi

if [[ ! -d "$PY_VENV_DIR" ]]; then
  log "Creating Python virtual environment..."
  "$PYTHON_BIN" -m venv "$PY_VENV_DIR"
fi

if [[ -x "$PY_VENV_DIR/bin/python" ]]; then
  VENV_PYTHON="$PY_VENV_DIR/bin/python"
  VENV_PIP="$PY_VENV_DIR/bin/pip"
elif [[ -x "$PY_VENV_DIR/Scripts/python.exe" ]]; then
  VENV_PYTHON="$PY_VENV_DIR/Scripts/python.exe"
  VENV_PIP="$PY_VENV_DIR/Scripts/pip.exe"
else
  log "Unable to locate Python executable in virtual environment."
  exit 1
fi

log "Installing backend agent dependencies..."
"$VENV_PIP" install -r "$PY_AGENT_DIR/requirements.txt"

log "Starting frontend on http://localhost:${FRONTEND_PORT}"
(
  cd "$ROOT_DIR"
  PORT="$FRONTEND_PORT" npm run dev
) &
FRONTEND_PID=$!

log "Starting Python agent -> ${BACKEND_ENDPOINT} (interval: ${AGENT_INTERVAL}s)"
(
  cd "$PY_AGENT_DIR"
  "$VENV_PYTHON" agent.py --interval "$AGENT_INTERVAL" --endpoint "$BACKEND_ENDPOINT"
) &
AGENT_PID=$!

log "Frontend PID: $FRONTEND_PID"
log "Agent PID: $AGENT_PID"
log "Press Ctrl+C to stop both services."

wait -n "$FRONTEND_PID" "$AGENT_PID"
log "One service exited; shutting down the other."
