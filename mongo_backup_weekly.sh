#!/bin/zsh
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="${ENV_FILE:-$PROJECT_DIR/server/.env}"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

BACKUP_DIR="$HOME/mongo_backups"
DATE="$(date +%F)"
WORK_DIR="$BACKUP_DIR/work_$DATE"
ARCHIVE="$BACKUP_DIR/budexpert_$DATE.tgz"

mkdir -p "$BACKUP_DIR"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

: "${MONGO_URI:?MONGO_URI env var is required}"

mongodump --uri="$MONGO_URI" --out "$WORK_DIR"
tar -czf "$ARCHIVE" -C "$WORK_DIR" .
rm -rf "$WORK_DIR"

# залишаємо останні 8 архівів
ls -1t "$BACKUP_DIR"/budexpert_*.tgz 2>/dev/null | tail -n +9 | xargs -r rm -f