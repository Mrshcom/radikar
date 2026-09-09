#!/bin/sh
set -eu

compose_file="${COMPOSE_FILE:-compose.production.yml}"
env_file="${ENV_FILE:-deploy/.env.production}"
backup_dir="${BACKUP_DIR:-backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="${backup_dir}/radicar-${timestamp}.dump"

mkdir -p "${backup_dir}"

docker compose --env-file "${env_file}" -f "${compose_file}" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  > "${backup_path}"

echo "PostgreSQL backup created: ${backup_path}"
