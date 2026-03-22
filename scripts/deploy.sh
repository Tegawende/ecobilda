#!/bin/bash
set -euo pipefail

PROJECT_DIR="/opt/ecobilda"
COMPOSE_FILE="docker-compose.prod.yml"

echo "=== Ecobilda Deploy Started: $(date) ==="

cd "$PROJECT_DIR"

# Pull latest code
echo "--- Pulling latest code ---"
git pull origin main

# Build and restart containers
echo "--- Building Docker images ---"
docker compose -f "$COMPOSE_FILE" build --parallel

echo "--- Starting containers ---"
docker compose -f "$COMPOSE_FILE" up -d

# Wait for backend to be ready
echo "--- Waiting for backend to be healthy ---"
sleep 10

# Run migrations
echo "--- Running migrations ---"
docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py migrate --noinput

# Collect static files (also copies to the shared volume)
echo "--- Collecting static files ---"
docker compose -f "$COMPOSE_FILE" exec -T backend python manage.py collectstatic --noinput

# Build admin panel (static files served by Caddy)
echo "--- Building admin panel ---"
if [ -d "$PROJECT_DIR/admin" ]; then
    cd "$PROJECT_DIR/admin"
    npm ci --production=false
    VITE_API_URL=https://api.ecobilda.org/api npm run build
    rsync -a --delete dist/ /opt/ecobilda/admin-dist/
    cd "$PROJECT_DIR"
fi

# Copy static/media files to Caddy-accessible paths
echo "--- Syncing static and media files ---"
docker cp ecobilda-backend:/app/staticfiles/. /opt/ecobilda/staticfiles/
docker cp ecobilda-backend:/app/media/. /opt/ecobilda/media/ 2>/dev/null || true

# Cleanup old images
docker image prune -f

echo "=== Deploy Complete: $(date) ==="
