@echo off
echo ========================================
echo  Ecobilda - Demarrage Local Windows
echo  (sans Docker)
echo ========================================
echo.

REM Verifier PostgreSQL
echo [1/2] Verification PostgreSQL...
pg_isready -h localhost -p 5432 >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] PostgreSQL est en cours d'execution sur le port 5432
) else (
    echo [ERREUR] PostgreSQL n'est pas accessible
    echo.
    echo Veuillez demarrer PostgreSQL:
    echo - Ouvrir pgAdmin 4
    echo - Ou demarrer le service: net start postgresql-x64-15
    echo.
    pause
    exit /b 1
)

echo.

REM Verifier Redis
echo [2/2] Verification Redis...
redis-cli ping >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Redis est en cours d'execution sur le port 6379
) else (
    echo [ERREUR] Redis n'est pas accessible
    echo.
    echo Veuillez demarrer Redis:
    echo - Si Memurai: Verifier le service Windows "Memurai"
    echo - Si redis-server.exe: Lancer redis-server.exe manuellement
    echo - Si WSL2: sudo service redis-server start
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Services OK - Prets pour le dev
echo ========================================
echo.
echo Prochaines etapes:
echo.
echo Terminal 1: cd backend ^&^& run-django.bat
echo Terminal 2: cd backend ^&^& run-celery.bat
echo Terminal 3: cd frontend ^&^& run-frontend.bat
echo.
echo ========================================
pause
