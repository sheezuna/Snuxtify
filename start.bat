@echo off
REM Start script for MT5 Dashboard on Windows

echo Starting MT5 Real-time Dashboard...

REM Start Redis if not running
docker ps | findstr "mt5-redis" >nul
if %errorlevel% neq 0 (
    echo Starting Redis...
    docker-compose up -d redis
    timeout /t 3 /nobreak >nul
)

REM Start backend in a new command window
echo Starting FastAPI backend...
start "MT5 Backend" cmd /k "cd backend && python main.py"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in a new command window
echo Starting Next.js frontend...
start "MT5 Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✓ Services are starting...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to open the dashboard in your browser...
pause >nul

REM Open browser
start http://localhost:3000
