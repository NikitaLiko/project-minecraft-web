#!/bin/bash
set -euo pipefail

APP_DIR="/root/warborn"
BACKUP_ROOT="/root/warborn-backups"
STATIC_DIR="$APP_DIR/.next/static"
STANDALONE_STATIC="$APP_DIR/.next/standalone/.next/static"
PUBLIC_DIR="$APP_DIR/public"
STANDALONE_PUBLIC="$APP_DIR/.next/standalone/public"

mysql_backup() {
  mkdir -p "$BACKUP_ROOT"
  local TS OUT
  TS=$(date +%Y%m%d-%H%M%S)
  OUT="${BACKUP_ROOT}/warborn-mysql-${TS}.sql.gz"
  echo "=== DB backup -> ${OUT}"
  eval "$(APP_DIR="$APP_DIR" node "$APP_DIR/scripts/print-mysqldump-env.js")"
  mysqldump -h "$MD_HOST" -P "$MD_PORT" -u "$MD_USER" -p"$MD_PASS" \
    --single-transaction --routines --triggers "$MD_DB" | gzip >"$OUT"
  unset MD_HOST MD_PORT MD_USER MD_PASS MD_DB
  echo "=== Backup size: $(du -h "$OUT" | cut -f1)"
  ls -1t "$BACKUP_ROOT"/warborn-mysql-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -f
}

deploy_systemd() {
  cd "$APP_DIR"

  echo "=== [1/7] MySQL backup"
  mysql_backup

  echo "=== [2/7] npm ci"
  npm ci

  echo "=== [3/7] prisma generate (миграции не запускаем)"
  npx prisma generate

  echo "=== [4/7] Building Next.js"
  npm run build

  echo "=== [5/7] Copying static assets into standalone"
  rm -rf "$STANDALONE_STATIC" "$STANDALONE_PUBLIC"
  cp -r "$STATIC_DIR" "$STANDALONE_STATIC"
  cp -r "$PUBLIC_DIR" "$STANDALONE_PUBLIC"

  echo "=== [6/7] Purging nginx cache"
  rm -rf /var/cache/nginx/warborn/*

  echo "=== [7/7] Restarting warborn + nginx"
  systemctl restart warborn
  systemctl reload nginx

  echo ""
  echo "=== Deploy complete (systemd) ==="
  systemctl --no-pager status warborn | head -10
}

deploy_docker() {
  cd "$APP_DIR"

  echo "=== [docker 1/5] MySQL backup"
  mysql_backup

  echo "=== [docker 2/5] stop systemd unit (освобождаем :3000)"
  systemctl stop warborn || true

  echo "=== [docker 3/5] docker compose build"
  docker compose build --pull

  echo "=== [docker 4/5] docker compose up"
  docker compose up -d

  echo "=== [docker 4b/5] sync _next/static и public на хост (nginx отдаёт их с диска)"
  CID="$(docker compose ps -q pjm-web)"
  mkdir -p "$STATIC_DIR" "$PUBLIC_DIR"
  docker cp "${CID}:/app/.next/static/." "$STATIC_DIR/"
  docker cp "${CID}:/app/public/." "$PUBLIC_DIR/"

  echo "=== [docker 5/5] nginx reload"
  systemctl reload nginx

  echo ""
  echo "=== Deploy complete (Docker) ==="
  docker compose ps
}

case "${1:-}" in
  docker)
    deploy_docker
    ;;
  "")
    deploy_systemd
    ;;
  *)
    echo "Usage: $0           # systemd: backup + build + restart warborn"
    echo "       $0 docker     # backup + docker compose build && up (network_mode: host)"
    exit 1
    ;;
esac
