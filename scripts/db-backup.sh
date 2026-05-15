#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env.service}"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
CONTAINER_NAME="${POSTGRES_CONTAINER:-rentnao-postgres}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing env file: $ENV_FILE" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

: "${POSTGRES_USER:?POSTGRES_USER is required}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required}"
: "${POSTGRES_DB:?POSTGRES_DB is required}"

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "Postgres container not running: $CONTAINER_NAME" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

timestamp="$(date +"%Y%m%d_%H%M%S")"
backup_file="$BACKUP_DIR/rentnao_${timestamp}.dump"

export PGPASSWORD="$POSTGRES_PASSWORD"

docker exec -e PGPASSWORD="$PGPASSWORD" "$CONTAINER_NAME" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -F c -Z 6 \
  > "$backup_file"

find "$BACKUP_DIR" -type f -name "rentnao_*.dump" -mtime +"$RETENTION_DAYS" -delete

echo "Backup complete: $backup_file"
