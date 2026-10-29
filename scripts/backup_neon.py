#!/usr/bin/env python3
"""
==============================================================================
BelHagh Database Automated Hourly Backup
Target: /home/safaan/backups/belhagh_db/
Retention: Keep exactly the 12 most recent backups
Database: Neon PostgreSQL
==============================================================================
"""

import os
import sys
import glob
import gzip
import datetime
import traceback
import psycopg2

BACKUP_DIR = os.getenv("BACKUP_DIR", "/home/safaan/backups/belhagh_db")
LOG_FILE = os.getenv("LOG_FILE", "/home/safaan/backups/backup.log")
DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require"
)
RETENTION_LIMIT = int(os.getenv("RETENTION_LIMIT", "12"))

def log(message: str):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted = f"[{timestamp}] {message}"
    print(formatted)
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(formatted + "\n")
    except Exception as e:
        sys.stderr.write(f"Failed to write to log file: {e}\n")

def get_table_ddl(cur, schema_name: str, table_name: str) -> str:
    """Generate DDL for table creation and indexes."""
    cur.execute("""
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = %s AND table_name = %s
        ORDER BY ordinal_position;
    """, (schema_name, table_name))
    cols = cur.fetchall()

    col_defs = []
    for c in cols:
        name, dtype, max_len, is_null, default_val = c
        col_type = dtype.upper()
        if max_len and col_type in ("CHARACTER VARYING", "VARCHAR"):
            col_type = f"VARCHAR({max_len})"
        elif col_type == "USER-DEFINED":
            col_type = "TEXT"
        
        nullable = "" if is_null == "YES" else " NOT NULL"
        default = f" DEFAULT {default_val}" if default_val else ""
        col_defs.append(f'    "{name}" {col_type}{nullable}{default}')

    ddl = [f'-- Table: {schema_name}.{table_name}']
    ddl.append(f'CREATE TABLE IF NOT EXISTS "{schema_name}"."{table_name}" (')
    ddl.append(",\n".join(col_defs))
    ddl.append(");\n")

    # Get primary key
    cur.execute("""
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_schema = %s
          AND tc.table_name = %s;
    """, (schema_name, table_name))
    pk_cols = [r[0] for r in cur.fetchall()]
    if pk_cols:
        pk_cols_str = ", ".join(f'"{col}"' for col in pk_cols)
        ddl.append(f'ALTER TABLE "{schema_name}"."{table_name}" DROP CONSTRAINT IF EXISTS "{table_name}_pkey";')
        ddl.append(f'ALTER TABLE "{schema_name}"."{table_name}" ADD PRIMARY KEY ({pk_cols_str});\n')

    return "\n".join(ddl)

def perform_backup() -> str:
    os.makedirs(BACKUP_DIR, exist_ok=True)
    now = datetime.datetime.now()
    timestamp_str = now.strftime("%Y%m%d_%H%M%S")
    backup_filename = f"belhagh_backup_{timestamp_str}.sql.gz"
    backup_filepath = os.path.join(BACKUP_DIR, backup_filename)

    log(f"🚀 Starting Neon PostgreSQL database backup to {backup_filename}...")

    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    try:
        # Discover base tables in public schema
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        tables = [row[0] for row in cur.fetchall()]
        log(f"📦 Discovered {len(tables)} tables to backup: {', '.join(tables)}")

        with gzip.open(backup_filepath, "wt", encoding="utf-8", compresslevel=9) as gz:
            gz.write("-- ========================================================\n")
            gz.write(f"-- BelHagh Production Database Backup\n")
            gz.write(f"-- Exported: {now.isoformat()} UTC\n")
            gz.write(f"-- Source: Neon PostgreSQL (neondb)\n")
            gz.write(f"-- Tables: {', '.join(tables)}\n")
            gz.write("-- ========================================================\n\n")
            gz.write("SET statement_timeout = 0;\n")
            gz.write("SET client_encoding = 'UTF8';\n")
            gz.write("SET standard_conforming_strings = on;\n")
            gz.write("SET check_function_bodies = false;\n\n")

            total_rows_backed_up = 0

            for t in tables:
                # 1. Write table DDL
                table_ddl = get_table_ddl(cur, "public", t)
                gz.write(table_ddl)
                gz.write("\n")

                # 2. Get column list for COPY
                cur.execute("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_schema = 'public' AND table_name = %s
                    ORDER BY ordinal_position;
                """, (t,))
                col_names = [f'"{r[0]}"' for r in cur.fetchall()]
                cols_joined = ", ".join(col_names)

                gz.write(f'COPY "public"."{t}" ({cols_joined}) FROM stdin;\n')

                # 3. Stream data using COPY TO STDOUT
                cur.copy_expert(f'COPY "public"."{t}" ({cols_joined}) TO STDOUT WITH (FORMAT text)', gz)
                gz.write("\\.\n\n")

                cur.execute(f'SELECT count(*) FROM "public"."{t}";')
                count = cur.fetchone()[0]
                total_rows_backed_up += count
                log(f"  • Table public.{t}: {count} records exported.")

            gz.write("-- Backup finished successfully\n")

        file_size_bytes = os.path.getsize(backup_filepath)
        size_human = f"{file_size_bytes / 1024:.1f} KB" if file_size_bytes < 1024 * 1024 else f"{file_size_bytes / (1024 * 1024):.2f} MB"
        log(f"✅ Backup created: {backup_filename} (Size: {size_human}, Total rows: {total_rows_backed_up})")
        return backup_filepath

    finally:
        cur.close()
        conn.close()

def enforce_retention():
    """Keep exactly the latest RETENTION_LIMIT backups and delete older ones."""
    pattern = os.path.join(BACKUP_DIR, "belhagh_backup_*.sql.gz")
    files = glob.glob(pattern)
    files.sort(key=os.path.getmtime, reverse=True)

    pruned = 0
    if len(files) > RETENTION_LIMIT:
        to_delete = files[RETENTION_LIMIT:]
        for f in to_delete:
            try:
                os.remove(f)
                log(f"🗑️ Pruned old backup: {os.path.basename(f)}")
                pruned += 1
            except Exception as e:
                log(f"⚠️ Failed to delete {f}: {e}")

    active_count = len(glob.glob(pattern))
    log(f"📦 Active backups retained: {active_count} (Retention policy: last {RETENTION_LIMIT}, Pruned this run: {pruned})")

def main():
    try:
        perform_backup()
        enforce_retention()
        log("🏁 Hourly backup cycle completed successfully.\n")
        sys.exit(0)
    except Exception as e:
        log(f"❌ Backup failed with error: {e}")
        log(traceback.format_exc())
        sys.exit(1)

if __name__ == "__main__":
    main()
