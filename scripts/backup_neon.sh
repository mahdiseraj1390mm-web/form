#!/usr/bin/env bash
# ==============================================================================
# BelHagh Database Hourly Backup Script
# Entry point for Cron
# ==============================================================================

set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_EXEC="/usr/bin/python3"
BACKUP_PY="${SCRIPT_DIR}/backup_neon.py"

if [ ! -f "$BACKUP_PY" ]; then
    echo "Error: $BACKUP_PY not found!" >&2
    exit 1
fi

exec "$PYTHON_EXEC" "$BACKUP_PY" "$@"
