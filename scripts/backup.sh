#!/bin/bash
set -euo pipefail

BACKUP_DIR="/opt/ecobilda/backups/db"
COMPOSE_FILE="/opt/ecobilda/docker-compose.prod.yml"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

echo "=== Backup Started: $(date) ==="

# Dump PostgreSQL database
docker compose -f "$COMPOSE_FILE" exec -T db \
    pg_dump -U "${DB_USER:-ecobilda}" "${DB_NAME:-ecobilda}" \
    | gzip > "$BACKUP_DIR/ecobilda_${DATE}.sql.gz"

# Check backup was created and is not empty
BACKUP_FILE="$BACKUP_DIR/ecobilda_${DATE}.sql.gz"
if [ -s "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup created: $BACKUP_FILE ($SIZE)"
else
    echo "ERROR: Backup file is empty or missing!"
    exit 1
fi

# Remove backups older than retention period
find "$BACKUP_DIR" -name "ecobilda_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "Cleaned up backups older than ${RETENTION_DAYS} days"

echo "=== Backup Complete: $(date) ==="
