#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-/root/warborn}"

cd "$APP_DIR"

echo "=== git pull (origin main)"
if ! GIT_TERMINAL_PROMPT=0 git pull --ff-only origin main; then
  echo ""
  echo "Не удалось выполнить git pull. Проверьте SSH-ключ (Deploy key) и remote:"
  echo "  git remote -v  →  git@github.com:NikitaLiko/project-minecraft-web.git"
  exit 1
fi

echo "=== Pull complete ==="
