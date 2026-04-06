#!/bin/bash
set -euo pipefail

PROJECT_DIR="/opt/ecobilda"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== Ecobilda Deploy Started: $(date) ==="

cd "$PROJECT_DIR"

# Pull latest code
echo "--- Pulling latest code ---"
git pull origin main

# Build and restart containers (Convex + Frontend)
echo "--- Building Docker images ---"
docker compose -f "$COMPOSE_FILE" build --parallel

echo "--- Starting containers ---"
docker compose -f "$COMPOSE_FILE" up -d

# Wait for Convex backend to be ready
echo "--- Waiting for Convex backend ---"
sleep 10

# Deploy Convex functions
echo "--- Deploying Convex functions ---"
cd "$PROJECT_DIR/frontend"
source "$PROJECT_DIR/.env"
CONVEX_SELF_HOSTED_URL=http://127.0.0.1:3210 \
CONVEX_SELF_HOSTED_ADMIN_KEY="$CONVEX_SELF_HOSTED_ADMIN_KEY" \
npx convex deploy --url http://127.0.0.1:3210 --admin-key "$CONVEX_SELF_HOSTED_ADMIN_KEY"
cd "$PROJECT_DIR"

# Build admin panel (static files served by Caddy)
echo "--- Building admin panel ---"
if [ -d "$PROJECT_DIR/admin" ]; then
    cd "$PROJECT_DIR/admin"
    npm ci --production=false
    VITE_CONVEX_URL=https://convex.ecobilda.org npm run build
    rsync -a --delete dist/ /opt/ecobilda/admin-dist/
    cd "$PROJECT_DIR"
fi

# Cleanup old images
docker image prune -f

echo "=== Deploy Complete: $(date) ==="
