#!/bin/bash
# Warborn daily maintenance — intended for cron
# Runs: cleanup old DB records, rotate backups, optimize tables

set -e
LOG="/var/log/warborn-maintenance.log"
exec >> "$LOG" 2>&1
echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="

# 1. Backup database (compressed)
echo "[backup] Creating daily backup..."
mkdir -p /root/warborn-backups
mysqldump warborn | gzip > "/root/warborn-backups/warborn_$(date +%Y%m%d_%H%M%S).sql.gz"

# 2. Rotate backups — keep last 14
echo "[backup] Rotating (keep 14)..."
ls -1t /root/warborn-backups/warborn_*.sql* 2>/dev/null | tail -n +15 | xargs -r rm -f

# 3. Cleanup auth_logs older than 90 days
echo "[cleanup] auth_logs > 90 days..."
DELETED=$(mysql -N -e "DELETE FROM auth_logs WHERE createdAt < DATE_SUB(NOW(), INTERVAL 90 DAY); SELECT ROW_COUNT();" warborn 2>/dev/null)
echo "  Removed $DELETED auth_logs"

# 4. Cleanup server_metrics — keep last 5000
echo "[cleanup] server_metrics (keep 5000)..."
TOTAL=$(mysql -N -e "SELECT COUNT(*) FROM server_metrics;" warborn 2>/dev/null)
if [ "${TOTAL:-0}" -gt 5000 ]; then
    mysql -e "DELETE FROM server_metrics WHERE id NOT IN (SELECT id FROM (SELECT id FROM server_metrics ORDER BY createdAt DESC LIMIT 5000) AS keep);" warborn 2>/dev/null
    echo "  Had $TOTAL, trimmed to 5000"
else
    echo "  $TOTAL rows, no trim needed"
fi

# 5. Cleanup expired sessions
echo "[cleanup] expired sessions..."
mysql -e "DELETE FROM sessions WHERE expires < NOW();" warborn 2>/dev/null
echo "  Done"

# 6. Optimize tables
echo "[optimize] Running OPTIMIZE TABLE..."
mysql -e "OPTIMIZE TABLE auth_logs, server_metrics, sessions;" warborn 2>/dev/null

echo "[done] Maintenance complete"
echo ""
