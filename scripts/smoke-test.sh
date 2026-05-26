#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/../witsml-socket-cs"
QUESTDB_ROOT="$HOME/.questdb-root"
QUESTDB_BIN="$HOME/questdb/bin/questdb.sh"

DOTNET_PID=""
QUESTDB_STARTED=0
CLEANED_UP=0
BACKEND_PROBE="/tmp/realtime-monitoring-backend-probe.$$"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${CYAN}[smoke]${NC} $*"; }
log_ok()    { echo -e "${GREEN}[smoke]${NC} $*"; }
log_warn()  { echo -e "${YELLOW}[smoke]${NC} $*"; }
log_error() { echo -e "${RED}[smoke]${NC} $*"; }

questdb_is_running() {
    "$QUESTDB_BIN" status -d "$QUESTDB_ROOT" 2>/dev/null | grep -q '^PID:'
}

questdb_ready() {
    curl -sf http://127.0.0.1:9003 >/dev/null 2>&1 || \
        curl -sf 'http://127.0.0.1:9000/exec?query=select%201' >/dev/null 2>&1
}

backend_ready() {
    local code
    code="$(curl -s -o "$BACKEND_PROBE" -w '%{http_code}' http://127.0.0.1:8080/api/tiles || true)"

    # The backend root is a WebSocket endpoint, so plain HTTP GET / returns 400.
    # Probe /api/tiles instead and accept its expected validation error as the
    # signal that Kestrel + endpoint routing are ready.
    [ "$code" = "400" ] && grep -q 'INVALID_STREAM\|stream must' "$BACKEND_PROBE"
}

cleanup() {
    if [ "$CLEANED_UP" -eq 1 ]; then
        return
    fi
    CLEANED_UP=1

    echo ""
    log_info "Shutting down..."

    if [ -n "$DOTNET_PID" ] && kill -0 "$DOTNET_PID" 2>/dev/null; then
        log_info "Stopping dotnet (pid $DOTNET_PID)..."
        kill "$DOTNET_PID" 2>/dev/null || true
        wait "$DOTNET_PID" 2>/dev/null || true
    fi

    if [ "$QUESTDB_STARTED" -eq 1 ]; then
        log_info "Stopping QuestDB..."
        "$QUESTDB_BIN" stop -d "$QUESTDB_ROOT" 2>/dev/null || true
    else
        log_info "Leaving QuestDB running; it was already running before smoke test."
    fi

    rm -f "$BACKEND_PROBE"
    log_ok "All services stopped."
}
trap cleanup EXIT INT TERM

if [ ! -x "$QUESTDB_BIN" ]; then
    log_error "QuestDB binary not found or not executable: $QUESTDB_BIN"
    exit 1
fi

if [ ! -d "$BACKEND_DIR" ]; then
    log_error "Backend directory not found: $BACKEND_DIR"
    exit 1
fi

log_info "Starting QuestDB..."
if questdb_is_running; then
    log_ok "QuestDB is already running"
else
    # Do not pass -n here: in QuestDB's script -n disables the HUP handler and
    # keeps the JVM in the foreground, which blocks this smoke script.
    "$QUESTDB_BIN" start -d "$QUESTDB_ROOT"
    QUESTDB_STARTED=1
fi

log_info "Waiting for QuestDB health check (9003 or /exec on 9000)..."
for _ in $(seq 1 30); do
    if questdb_ready; then
        break
    fi
    sleep 1
done

if ! questdb_ready; then
    log_error "QuestDB failed to become ready within 30s"
    exit 1
fi
log_ok "QuestDB is ready"

log_info "Starting witsml-socket-cs (dotnet run)..."
ASPNETCORE_ENVIRONMENT=Development dotnet run --project "$BACKEND_DIR" &
DOTNET_PID=$!

log_info "Waiting for backend on ws://localhost:8080..."
for _ in $(seq 1 60); do
    if backend_ready; then
        break
    fi
    if ! kill -0 "$DOTNET_PID" 2>/dev/null; then
        log_error "dotnet process died unexpectedly"
        exit 1
    fi
    sleep 1
done

if ! backend_ready; then
    log_error "Backend failed to start within 60s"
    exit 1
fi
log_ok "Backend is ready on ws://localhost:8080"

log_info "Starting realtime-monitoring (pnpm dev)..."
log_info ""
log_info "  Dashboard : http://localhost:5173"
log_info "  QuestDB   : http://localhost:9000"
log_info "  Backend   : ws://localhost:8080"
log_info "  Auth token: dev-token"
log_info ""
log_info "Press Ctrl+C to stop services started by this script."
echo ""

pnpm --dir "$PROJECT_DIR" dev
