#!/bin/bash
set -e

# ═══ Configuration ═══
APP_DIR="/root/warborn"
BACKUP_DIR="/root/warborn-backups"
MODE="${1:-manual}"  # "docker" or "manual" (default)

cd "$APP_DIR"

# ═══ Pre-deploy backup ═══
echo "=== [0/5] Backing up database ==="
mkdir -p "$BACKUP_DIR"
if command -v mysqldump &>/dev/null; then
    mysqldump warborn | gzip > "$BACKUP_DIR/pre-deploy_$(date +%Y%m%d_%H%M%S).sql.gz"
    echo "  Backup saved to $BACKUP_DIR"
    # Keep last 14 backups
    ls -1t "$BACKUP_DIR"/warborn_*.sql* "$BACKUP_DIR"/pre-deploy_*.sql* 2>/dev/null | tail -n +15 | xargs -r rm -f
elif [ "$MODE" = "docker" ]; then
    docker compose exec -T db mysqldump -u root -p"$DB_ROOT_PASSWORD" warborn 2>/dev/null | gzip > "$BACKUP_DIR/pre-deploy_$(date +%Y%m%d_%H%M%S).sql.gz"
    echo "  Backup saved to $BACKUP_DIR (via docker)"
else
    echo "  WARNING: mysqldump not found, skipping backup"
fi

if [ "$MODE" = "docker" ]; then
    # ═══ Docker deploy ═══
    echo "=== [1/2] Building Docker image ==="
    docker compose build

    echo "=== [2/2] Starting containers ==="
    docker compose up -d

    echo ""
    echo "=== Docker deploy complete ==="
    docker compose ps
else
    # ═══ Manual deploy (systemd + nginx) ═══
    STATIC_DIR="$APP_DIR/.next/static"
    STANDALONE_STATIC="$APP_DIR/.next/standalone/.next/static"
    PUBLIC_DIR="$APP_DIR/public"
    STANDALONE_PUBLIC="$APP_DIR/.next/standalone/public"

    echo "=== [1/5] Building Next.js ==="
    npm run build

    echo "=== [2/5] Copying static assets into standalone ==="
    rm -rf "$STANDALONE_STATIC" "$STANDALONE_PUBLIC"
    cp -r "$STATIC_DIR" "$STANDALONE_STATIC"
    cp -r "$PUBLIC_DIR" "$STANDALONE_PUBLIC"

    echo "=== [3/5] Purging nginx cache ==="
    rm -rf /var/cache/nginx/warborn/*

    echo "=== [4/5] Restarting warborn service ==="
    systemctl restart warborn

    echo "=== [5/5] Reloading nginx ==="
    systemctl reload nginx

    echo ""
    echo "=== Deploy complete ==="
    systemctl --no-pager status warborn | head -10
fi
