#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

UPSTREAM_FILE="./nginx/active-upstream.conf"
CURRENT=$(cat "$UPSTREAM_FILE" 2>/dev/null || echo "")

if [[ $CURRENT == *"app_blue"* ]]; then
  ACTIVE="blue"
  TARGET="green"
  SERVICE="app_green"
  PORT=8082
else
  ACTIVE="green"
  TARGET="blue"
  SERVICE="app_blue"
  PORT=8081
fi

echo "================================================"
echo " Active Environment : $ACTIVE"
echo " Target Environment : $TARGET ($PORT)"
echo "================================================"

echo "[1/3] Building and starting $SERVICE..."
docker compose up -d --build "$SERVICE"

echo "[2/3] Verifying health check on http://localhost:$PORT/health..."
HEALTHY=0
for i in {1..20}; do
  if curl -sf "http://localhost:$PORT/health" | grep -q '"status":"HEALTHY"'; then
    echo "Health check passed on attempt $i!"
    HEALTHY=1
    break
  fi
  echo "Waiting for $TARGET ($i/20)..."
  sleep 2
done

if [ $HEALTHY -ne 1 ]; then
  echo "[ERROR] Health check failed for $TARGET! Aborting deployment."
  exit 1
fi

echo "[3/3] Switching Nginx traffic to $TARGET..."
echo "server ${SERVICE}:3000;" > "$UPSTREAM_FILE"
docker compose exec -T reverse-proxy nginx -s reload

echo "================================================"
echo " [SUCCESS] Traffic shifted to $TARGET without downtime!"
echo "================================================"

