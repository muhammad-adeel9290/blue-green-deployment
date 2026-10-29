#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "================================================"
echo " Starting instant rollback..."
echo "================================================"

UPSTREAM_FILE="./nginx/active-upstream.conf"
CURRENT=$(cat "$UPSTREAM_FILE" 2>/dev/null || echo "")

if [[ $CURRENT == *"app_blue"* ]]; then
  ROLLBACK_TO="app_green"
  COLOR="GREEN"
else
  ROLLBACK_TO="app_blue"
  COLOR="BLUE"
fi

echo "server ${ROLLBACK_TO}:3000;" > "$UPSTREAM_FILE"
docker compose exec -T reverse-proxy nginx -s reload

echo "================================================"
echo " [SUCCESS] Traffic immediately rolled back to: $COLOR ($ROLLBACK_TO)"
echo "================================================"
