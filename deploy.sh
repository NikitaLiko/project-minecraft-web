#!/bin/bash
set -e

APP_DIR="/root/warborn"
STATIC_DIR="$APP_DIR/.next/static"
STANDALONE_STATIC="$APP_DIR/.next/standalone/.next/static"
PUBLIC_DIR="$APP_DIR/public"
STANDALONE_PUBLIC="$APP_DIR/.next/standalone/public"

cd "$APP_DIR"

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
