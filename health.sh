#!/bin/bash
# Warborn Infrastructure Health Check

RED='\033[0;31m'
GRN='\033[0;32m'
YEL='\033[1;33m'
CYN='\033[0;36m'
RST='\033[0m'

ok()   { echo -e "  ${GRN}✓${RST} $1"; }
warn() { echo -e "  ${YEL}!${RST} $1"; }
fail() { echo -e "  ${RED}✗${RST} $1"; ERRORS=$((ERRORS+1)); }

ERRORS=0

echo -e "\n${CYN}═══ WARBORN HEALTH CHECK ═══${RST}\n"

# --- Services ---
echo -e "${CYN}[Services]${RST}"
for svc in warborn warborn-skins nginx mariadb; do
    if systemctl is-active --quiet "$svc"; then
        ok "$svc active"
    else
        fail "$svc DOWN"
    fi
done

# --- HTTP ---
echo -e "\n${CYN}[HTTP Endpoints]${RST}"

CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:3000/ 2>/dev/null)
if [ "$CODE" = "307" ] || [ "$CODE" = "200" ]; then
    ok "Next.js  :3000 → HTTP $CODE"
else
    fail "Next.js  :3000 → HTTP $CODE"
fi

CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:8090/ 2>/dev/null)
if [ "$CODE" = "200" ]; then
    ok "Skins    :8090 → HTTP $CODE"
else
    fail "Skins    :8090 → HTTP $CODE"
fi

CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 https://pjm.likonchik.xyz/ 2>/dev/null)
if [ "$CODE" = "200" ] || [ "$CODE" = "307" ] || [ "$CODE" = "302" ]; then
    ok "Nginx    pjm.likonchik.xyz → HTTP $CODE"
else
    warn "Nginx    pjm.likonchik.xyz → HTTP $CODE"
fi

# --- Resources ---
echo -e "\n${CYN}[Resources]${RST}"

MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
MEM_USED=$(free -m | awk '/^Mem:/{print $3}')
MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))
if [ "$MEM_PCT" -lt 80 ]; then
    ok "RAM: ${MEM_USED}M / ${MEM_TOTAL}M (${MEM_PCT}%)"
elif [ "$MEM_PCT" -lt 90 ]; then
    warn "RAM: ${MEM_USED}M / ${MEM_TOTAL}M (${MEM_PCT}%)"
else
    fail "RAM: ${MEM_USED}M / ${MEM_TOTAL}M (${MEM_PCT}%)"
fi

SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')
SWAP_USED=$(free -m | awk '/^Swap:/{print $3}')
if [ "$SWAP_TOTAL" -gt 0 ]; then
    SWAP_PCT=$((SWAP_USED * 100 / SWAP_TOTAL))
    if [ "$SWAP_PCT" -lt 50 ]; then
        ok "Swap: ${SWAP_USED}M / ${SWAP_TOTAL}M (${SWAP_PCT}%)"
    else
        warn "Swap: ${SWAP_USED}M / ${SWAP_TOTAL}M (${SWAP_PCT}%)"
    fi
fi

LOAD=$(awk '{print $1}' /proc/loadavg)
CPUS=$(nproc)
LOAD_INT=${LOAD%.*}
if [ "${LOAD_INT:-0}" -lt "$CPUS" ]; then
    ok "Load: $LOAD (${CPUS} cores)"
else
    warn "Load: $LOAD (${CPUS} cores)"
fi

DISK_PCT=$(df / --output=pcent | tail -1 | tr -d ' %')
DISK_AVAIL=$(df -h / --output=avail | tail -1 | tr -d ' ')
if [ "$DISK_PCT" -lt 80 ]; then
    ok "Disk: ${DISK_PCT}% used (${DISK_AVAIL} free)"
elif [ "$DISK_PCT" -lt 90 ]; then
    warn "Disk: ${DISK_PCT}% used (${DISK_AVAIL} free)"
else
    fail "Disk: ${DISK_PCT}% used (${DISK_AVAIL} free)"
fi

# --- Ports ---
echo -e "\n${CYN}[Ports]${RST}"
for port in 3000 8090; do
    BIND=$(ss -tlnp | grep ":${port} " | awk '{print $4}')
    if echo "$BIND" | grep -q "127.0.0.1"; then
        ok "Port $port → localhost only"
    elif [ -n "$BIND" ]; then
        warn "Port $port → $BIND (exposed!)"
    else
        fail "Port $port → not listening"
    fi
done

# --- Database ---
echo -e "\n${CYN}[Database]${RST}"
if mysqladmin ping -s 2>/dev/null | grep -q alive; then
    ok "MariaDB responding"
    METRICS_COUNT=$(mysql -N -e "SELECT COUNT(*) FROM server_metrics;" warborn 2>/dev/null)
    LOGS_COUNT=$(mysql -N -e "SELECT COUNT(*) FROM auth_logs;" warborn 2>/dev/null)
    USERS_COUNT=$(mysql -N -e "SELECT COUNT(*) FROM users;" warborn 2>/dev/null)
    ok "Users: ${USERS_COUNT:-?}  Metrics: ${METRICS_COUNT:-?}  AuthLogs: ${LOGS_COUNT:-?}"
else
    fail "MariaDB not responding"
fi

# --- SSL ---
echo -e "\n${CYN}[SSL Certificates]${RST}"
for CERT in /etc/letsencrypt/live/*/fullchain.pem; do
    DOMAIN=$(echo "$CERT" | cut -d/ -f5)
    EXPIRY=$(openssl x509 -enddate -noout -in "$CERT" 2>/dev/null | cut -d= -f2)
    DAYS=$(( ($(date -d "$EXPIRY" +%s) - $(date +%s)) / 86400 ))
    if [ "$DAYS" -gt 30 ]; then
        ok "$DOMAIN expires in ${DAYS}d"
    elif [ "$DAYS" -gt 7 ]; then
        warn "$DOMAIN expires in ${DAYS}d"
    else
        fail "$DOMAIN expires in ${DAYS}d!"
    fi
done

# --- Summary ---
echo ""
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GRN}═══ ALL OK ═══${RST}\n"
else
    echo -e "${RED}═══ $ERRORS PROBLEM(S) FOUND ═══${RST}\n"
fi

exit $ERRORS
