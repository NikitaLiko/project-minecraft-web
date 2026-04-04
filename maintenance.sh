#!/bin/bash
# Warborn daily maintenance — intended for cron
# Runs: cleanup old DB records, rotate backups, optimize tables
# Usage: ./maintenance.sh [docker|manual]

set -e
LOG="/var/log/warborn-maintenance.log"
exec >> "$LOG" 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="

MODE="${1:-auto}"
USE_DOCKER=false

if [ "$MODE" = "docker" ]; then
    USE_DOCKER=true
elif [ "$MODE" = "auto" ] && command -v docker &>/dev/null && docker compose ps --status running 2>/dev/null | grep -q "db"; then
    USE_DOCKER=true
fi

# Helper: run mysql command (works for both docker and host)
run_mysql() {
    if [ "$USE_DOCKER" = true ]; then
        docker compose exec -T db mysql -u root -p"${DB_ROOT_PASSWORD:-warborn}" warborn -e "$1" 2>/dev/null
    else
        mysql warborn -e "$1" 2>/dev/null
    fi
}

run_mysql_n() {
    if [ "$USE_DOCKER" = true ]; then
        docker compose exec -T db mysql -N -u root -p"${DB_ROOT_PASSWORD:-warborn}" warborn -e "$1" 2>/dev/null
    else
        mysql -N warborn -e "$1" 2>/dev/null
    fi
}

# 1. Backup database (compressed)
echo "[backup] Creating daily backup..."
mkdir -p /root/warborn-backups
if [ "$USE_DOCKER" = true ]; then
    docker compose exec -T db mysqldump -u root -p"${DB_ROOT_PASSWORD:-warborn}" warborn 2>/dev/null | gzip > "/root/warborn-backups/warborn_$(date +%Y%m%d_%H%M%S).sql.gz"
else
    mysqldump warborn | gzip > "/root/warborn-backups/warborn_$(date +%Y%m%d_%H%M%S).sql.gz"
fi

# 2. Rotate backups — keep last 14
echo "[backup] Rotating (keep 14)..."
ls -1t /root/warborn-backups/warborn_*.sql* /root/warborn-backups/pre-deploy_*.sql* 2>/dev/null | tail -n +15 | xargs -r rm -f

# 3. Cleanup auth_logs older than 90 days
echo "[cleanup] auth_logs > 90 days..."
DELETED=$(run_mysql_n "DELETE FROM auth_logs WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY); SELECT ROW_COUNT();")
echo "  Removed $DELETED auth_logs"

# 4. Cleanup server_metrics — keep last 5000
echo "[cleanup] server_metrics (keep 5000)..."
TOTAL=$(run_mysql_n "SELECT COUNT(*) FROM server_metrics;")
if [ "${TOTAL:-0}" -gt 5000 ]; then
    run_mysql "DELETE FROM server_metrics WHERE id NOT IN (SELECT id FROM (SELECT id FROM server_metrics ORDER BY createdAt DESC LIMIT 5000) AS keep);"
    echo "  Had $TOTAL, trimmed to 5000"
else
    echo "  $TOTAL rows, no trim needed"
fi

# 5. Cleanup expired sessions
echo "[cleanup] expired sessions..."
run_mysql "DELETE FROM sessions WHERE expires < NOW();"
echo "  Done"

# 6. Optimize tables
echo "[optimize] Running OPTIMIZE TABLE..."
run_mysql "OPTIMIZE TABLE auth_logs, server_metrics, sessions;"

echo "[done] Maintenance complete"
echo ""
