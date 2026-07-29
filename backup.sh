#!/bin/bash
set -euo pipefail

# Celestial Grace Inventory - Backup Script
# Usage: ./backup.sh [restore <backup_file.sql>]

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$APP_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/celestial_grace_$TIMESTAMP.sql"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

mkdir -p "$BACKUP_DIR"

if [ "${1:-}" = "restore" ] && [ -n "${2:-}" ]; then
  RESTORE_FILE="$2"
  if [ ! -f "$RESTORE_FILE" ]; then
    log_error "Backup file not found: $RESTORE_FILE"
    exit 1
  fi
  
  log_info "Restoring from: $RESTORE_FILE"
  
  if command -v docker &>/dev/null && docker compose ps &>/dev/null; then
    log_info "Restoring to Docker PostgreSQL..."
    docker compose exec -T postgres psql -U postgres -d celestial_grace < "$RESTORE_FILE"
  else
    log_info "Restoring to local PostgreSQL..."
    PGPASSWORD=postgres psql -U postgres -d celestial_grace < "$RESTORE_FILE"
  fi
  
  log_success "Restore complete!"
  exit 0
fi

# Create backup
log_info "Creating backup..."
mkdir -p "$BACKUP_DIR"

if command -v docker &>/dev/null && docker compose ps &>/dev/null; then
  log_info "Backing up Docker PostgreSQL..."
  docker compose exec -T postgres pg_dump -U postgres -d celestial_grace --no-owner --no-acl > "$BACKUP_FILE"
else
  log_info "Backing up local PostgreSQL..."
  PGPASSWORD=postgres pg_dump -U postgres -d celestial_grace --no-owner --no-acl > "$BACKUP_FILE"
fi

# Compress backup
gzip -f "$BACKUP_FILE"
BACKUP_FILE="$BACKUP_FILE.gz"

log_success "Backup created: $BACKUP_FILE"
log_info "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"

# Keep only last 30 backups
log_info "Cleaning old backups (keeping last 30)..."
ls -t "$BACKUP_DIR"/celestial_grace_*.sql.gz 2>/dev/null | tail -n +31 | xargs -r rm --

log_success "Backup complete!"
