#!/bin/bash
set -euo pipefail

PROJECT_DIR="/opt/ecobilda"
COMPOSE_FILE="docker-compose.prod.yml"
CONVEX_URL="http://127.0.0.1:3210"

echo "=== Ecobilda Deploy Started: $(date) ==="
cd "$PROJECT_DIR"

# ── 1. Build and restart Docker containers ──────────────────────
echo "--- Building Docker images ---"
docker compose -f "$COMPOSE_FILE" build --parallel

echo "--- Starting containers ---"
docker compose -f "$COMPOSE_FILE" up -d

# ── 2. Wait for Convex backend to be ready ──────────────────────
echo "--- Waiting for Convex backend ---"
for i in $(seq 1 30); do
  if curl -sf "$CONVEX_URL/version" > /dev/null 2>&1; then
    echo "Convex backend ready after ${i}s"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "ERROR: Convex backend not ready after 30s"
    docker logs ecobilda-convex --tail 20
    exit 1
  fi
  sleep 1
done

# ── 3. Deploy Convex functions ──────────────────────────────────
echo "--- Deploying Convex functions ---"
cd "$PROJECT_DIR/frontend"
CONVEX_ADMIN_KEY=$(grep '^CONVEX_SELF_HOSTED_ADMIN_KEY=' "$PROJECT_DIR/.env" | cut -d'=' -f2-)
CONVEX_SELF_HOSTED_URL="$CONVEX_URL" \
CONVEX_SELF_HOSTED_ADMIN_KEY="$CONVEX_ADMIN_KEY" \
npx convex dev --once

# ── 4. Build admin panel (static files served by Caddy) ─────────
echo "--- Building admin panel ---"
cd "$PROJECT_DIR/admin"
npm ci --production=false --silent
VITE_CONVEX_URL=https://convex.ecobilda.org npm run build
rsync -a --delete dist/ "$PROJECT_DIR/admin-dist/"

# ── 5. Cleanup ──────────────────────────────────────────────────
cd "$PROJECT_DIR"
docker image prune -f --filter "until=24h" > /dev/null 2>&1 || true

echo "=== Deploy Complete: $(date) ==="
