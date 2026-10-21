#!/bin/bash
set -e

UPSTREAM_FILE="./nginx/active-upstream.conf"
CURRENT=$(cat $UPSTREAM_FILE)

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

echo "Active: $ACTIVE | Target: $TARGET ($PORT)"
docker compose up -d --build $SERVICE

echo "Verifying health check..."
for i in {1..15}; do
  if curl -sf http://localhost:$PORT/health | grep -q '"status":"HEALTHY"'; then
    echo "Health check passed!"
    break
  fi
  echo "Waiting... ($i/15)"
  sleep 2
  if [ $i -eq 15 ]; then
    echo "Health check failed! Aborting."
    exit 1
  fi
done

echo "server ${SERVICE}:3000;" > $UPSTREAM_FILE
docker compose exec -T reverse-proxy nginx -s reload
echo "Deployment complete! Traffic shifted to $TARGET."
