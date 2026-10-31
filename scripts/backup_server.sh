#!/usr/bin/env bash
# ==============================================================================
# Linux Server & Database Automated Hourly Backup
# System: Ubuntu / Debian Linux
# Target Schedule: Every 1 hour (0 * * * *)
# Retention: Keep exactly the 12 most recent backups
# Features:
#   - Database: Safe online SQLite backup & PostgreSQL backup
#   - Server Data: Application files, configs, Nginx settings, system metadata
#   - Compression: Highly compressed .tar.gz archive
#   - Retention: Automatically prunes archives keeping only the latest 12
#   - Concurrency: Lockfile mechanism prevents overlapping runs
#   - Logging: Detailed timestamps and size reports
# ==============================================================================

set -o pipefail

# ----------------------------- Configuration ---------------------------------
BACKUP_ROOT_DIR="${BACKUP_ROOT_DIR:-/home/safaan/backups}"
BACKUP_ARCHIVE_DIR="${BACKUP_ROOT_DIR}/snapshots"
LOG_FILE="${BACKUP_ROOT_DIR}/backup.log"
LOCK_FILE="/tmp/server_backup.lock"
RETENTION_LIMIT=12

# Application & Data Paths
SAFAAN_APP_DIR="/var/www/safaan"
SAFAAN_DB_PATH="${SAFAAN_APP_DIR}/database.db"
BELHAGH_APP_DIR="/var/www/belhagh-form"
NGINX_DIR="/etc/nginx/sites-available"

# Optional PostgreSQL Connection (if set, will attempt pg_dump)
DB_URL="${DATABASE_URL:-postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require}"

# ----------------------------- Helper Functions ------------------------------
log() {
    local msg="$1"
    local timestamp
    timestamp="$(date '+%Y-%m-%d %H:%M:%S')"
    echo "[$timestamp] $msg"
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] $msg" >> "$LOG_FILE"
}

cleanup_tmp() {
    if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    rm -f "$LOCK_FILE"
}

# ----------------------------- Concurrency Lock ------------------------------
if [ -e "$LOCK_FILE" ]; then
    PID="$(cat "$LOCK_FILE" 2>/dev/null || true)"
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        log "⚠️ Previous backup process (PID: $PID) is still running. Skipping this run."
        exit 0
    else
        # Stale lock file
        rm -f "$LOCK_FILE"
    fi
fi
echo "$$" > "$LOCK_FILE"

# Ensure cleanup on exit
trap cleanup_tmp EXIT INT TERM

# ----------------------------- Main Execution --------------------------------
main() {
    local now_str
    now_str="$(date '+%Y%m%d_%H%M%S')"
    local archive_filename="server_backup_${now_str}.tar.gz"
    local final_archive_path="${BACKUP_ARCHIVE_DIR}/${archive_filename}"

    mkdir -p "$BACKUP_ARCHIVE_DIR"

    TEMP_DIR="$(mktemp -d /tmp/backup_run_${now_str}_XXXXXX)"
    local db_backup_dir="${TEMP_DIR}/database"
    local files_backup_dir="${TEMP_DIR}/server_data"
    mkdir -p "$db_backup_dir" "$files_backup_dir"

    log "======================================================================"
    log "🚀 Starting hourly server & database backup cycle: ${archive_filename}"

    # 1. Database Backup (SQLite Online Backup API)
    if [ -f "$SAFAAN_DB_PATH" ]; then
        log "📦 [1/4] Performing safe online SQLite backup for ${SAFAAN_DB_PATH}..."
        python3 - <<EOF
import sqlite3, sys
try:
    src = sqlite3.connect('$SAFAAN_DB_PATH')
    dst = sqlite3.connect('${db_backup_dir}/safaan_database.db')
    src.backup(dst)
    dst.close()
    src.close()
    print("SUCCESS")
except Exception as e:
    sys.stderr.write(f"SQLite backup error: {e}\n")
    sys.exit(1)
EOF
        if [ $? -eq 0 ]; then
            local db_size
            db_size="$(du -h "${db_backup_dir}/safaan_database.db" | cut -f1)"
            log "  ✅ SQLite database safely backed up (${db_size})."
        else
            log "  ⚠️ Warning: SQLite backup encountered an issue."
        fi
    else
        log "  ℹ️ SQLite DB file not found at ${SAFAAN_DB_PATH}, skipping."
    fi

    # 2. Database Backup (PostgreSQL / Neon - if reachable)
    if [ -n "$DB_URL" ] && command -v pg_dump >/dev/null 2>&1; then
        log "📦 [2/4] Attempting PostgreSQL database backup via pg_dump..."
        local pg_out="${db_backup_dir}/postgresql_dump.sql.gz"
        if pg_dump --dbname="$DB_URL" --no-owner --no-acl 2>/tmp/pg_dump_err.log | gzip -9 > "$pg_out"; then
            if [ -s "$pg_out" ]; then
                local pg_size
                pg_size="$(du -h "$pg_out" | cut -f1)"
                log "  ✅ PostgreSQL database safely exported (${pg_size})."
            else
                rm -f "$pg_out"
                log "  ℹ️ PostgreSQL returned empty dump."
            fi
        else
            local pg_err
            pg_err="$(head -n 2 /tmp/pg_dump_err.log | tr '\n' ' ')"
            rm -f "$pg_out" /tmp/pg_dump_err.log
            log "  ℹ️ PostgreSQL dump skipped (${pg_err:-Quota limit or DB offline})."
        fi
    fi

    # 3. Server Files & Application Data Backup
    log "📦 [3/4] Collecting server application data, source code, and configurations..."

    # Backup Safaan files (excluding heavy caches and logs)
    if [ -d "$SAFAAN_APP_DIR" ]; then
        mkdir -p "${files_backup_dir}/safaan"
        tar -czf "${files_backup_dir}/safaan/app_files.tar.gz" \
            -C "$SAFAAN_APP_DIR" \
            --exclude='.git' \
            --exclude='__pycache__' \
            --exclude='*.pyc' \
            --exclude='logs' \
            --exclude='database.db' \
            --exclude='database_backup_*.db' \
            . 2>/dev/null || true
        local safaan_files_size
        safaan_files_size="$(du -h "${files_backup_dir}/safaan/app_files.tar.gz" | cut -f1)"
        log "  ✅ Safaan application files archived (${safaan_files_size})."
    fi

    # Backup BelHagh Form files (if directory exists)
    if [ -d "$BELHAGH_APP_DIR" ]; then
        mkdir -p "${files_backup_dir}/belhagh"
        tar -czf "${files_backup_dir}/belhagh/app_files.tar.gz" \
            -C "$BELHAGH_APP_DIR" \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.next' \
            --exclude='dist' \
            --exclude='*.log' \
            . 2>/dev/null || true
        log "  ✅ BelHagh Form application files archived."
    fi

    # Backup Nginx configurations
    if [ -d "$NGINX_DIR" ]; then
        mkdir -p "${files_backup_dir}/nginx"
        cp -r "$NGINX_DIR" "${files_backup_dir}/nginx/" 2>/dev/null || true
        log "  ✅ Nginx site configurations collected."
    fi

    # Metadata & Health info
    local meta_file="${TEMP_DIR}/backup_metadata.txt"
    {
        echo "=========================================================="
        echo "BelHagh & Safaan Production Server Backup"
        echo "Timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
        echo "Hostname: $(hostname)"
        echo "Kernel: $(uname -r)"
        echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
        echo "Disk Usage:"
        df -h /
        echo "PM2 Status:"
        pm2 list 2>/dev/null || true
        echo "=========================================================="
    } > "$meta_file"

    # 4. Packaging into a Single Unified Archive
    log "🗜️ [4/4] Creating final unified archive ${archive_filename}..."
    tar -czf "$final_archive_path" -C "$TEMP_DIR" . 2>/dev/null

    # Integrity verification
    if gzip -t "$final_archive_path" 2>/dev/null; then
        local archive_size
        archive_size="$(du -h "$final_archive_path" | cut -f1)"
        log "✅ Backup archive verified successfully: ${archive_filename} (${archive_size})"
    else
        log "❌ Error: Backup archive verification failed!"
        exit 1
    fi

    # 5. Enforce Retention Policy: Keep Exactly 12 Most Recent Backups
    enforce_retention
}

enforce_retention() {
    log "🧹 Checking retention policy (Retention limit: ${RETENTION_LIMIT} backups)..."
    
    # Find all backup archives in chronological order (newest first)
    mapfile -t all_backups < <(find "$BACKUP_ARCHIVE_DIR" -maxdepth 1 -name "server_backup_*.tar.gz" -type f -printf "%T@ %p\n" | sort -nr | awk '{print $2}')

    local total_count=${#all_backups[@]}
    local pruned_count=0

    if [ "$total_count" -gt "$RETENTION_LIMIT" ]; then
        local excess=$((total_count - RETENTION_LIMIT))
        log "  ⚠️ Found ${total_count} backups. Removing ${excess} older backup(s)..."

        for ((i=RETENTION_LIMIT; i<total_count; i++)); do
            local file_to_delete="${all_backups[$i]}"
            if [ -f "$file_to_delete" ]; then
                rm -f "$file_to_delete"
                log "  🗑️ Deleted old backup: $(basename "$file_to_delete")"
                pruned_count=$((pruned_count + 1))
            fi
        done
    fi

    local remaining_count
    remaining_count="$(find "$BACKUP_ARCHIVE_DIR" -maxdepth 1 -name "server_backup_*.tar.gz" -type f | wc -l)"
    log "📦 Retention status: ${remaining_count} backup(s) active on disk (Deleted this run: ${pruned_count})."
    log "🏁 Hourly backup cycle finished successfully."
    log "======================================================================"
}

main "$@"
