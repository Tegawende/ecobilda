# Ecobilda Development Startup Script
# Usage: .\start-dev.ps1

Write-Host "Starting Ecobilda Development Environment" -ForegroundColor Green
Write-Host ""

# Check if Docker is running
$dockerRunning = docker ps 2>$null
if (-not $?) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Docker is running" -ForegroundColor Green

# Start PostgreSQL
Write-Host ""
Write-Host "[1/2] Starting PostgreSQL..." -ForegroundColor Cyan
docker ps -a --filter "name=ecobilda-postgres" --format "{{.Names}}" | Out-Null
if ($?) {
    docker start ecobilda-postgres 2>$null
    if (-not $?) {
        docker run -d `
            --name ecobilda-postgres `
            -e POSTGRES_DB=ecobilda `
            -e POSTGRES_USER=postgres `
            -e POSTGRES_PASSWORD=postgres `
            -p 5432:5432 `
            postgis/postgis:15-3.3
    }
    Write-Host "[OK] PostgreSQL running on port 5432" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start PostgreSQL" -ForegroundColor Red
    exit 1
}

# Start Redis
Write-Host ""
Write-Host "[2/2] Starting Redis..." -ForegroundColor Cyan
docker ps -a --filter "name=ecobilda-redis" --format "{{.Names}}" | Out-Null
if ($?) {
    docker start ecobilda-redis 2>$null
    if (-not $?) {
        docker run -d `
            --name ecobilda-redis `
            -p 6379:6379 `
            redis:7-alpine
    }
    Write-Host "[OK] Redis running on port 6379" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Failed to start Redis" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Instructions for manual steps
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host "NEXT STEPS - Open 3 NEW terminals:" -ForegroundColor Yellow
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Terminal 1 - Backend (Django ASGI):" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  .\run-django.bat" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Celery Worker:" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  .\run-celery.bat" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 3 - Frontend (React):" -ForegroundColor Cyan
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  .\run-frontend.bat" -ForegroundColor White
Write-Host ""
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host "Full testing guide: TESTING_REALTIME.md" -ForegroundColor Green
Write-Host "===============================================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to stop services..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Cleanup
Write-Host ""
Write-Host "Stopping services..." -ForegroundColor Yellow
docker stop ecobilda-postgres ecobilda-redis
Write-Host "[OK] Services stopped" -ForegroundColor Green
