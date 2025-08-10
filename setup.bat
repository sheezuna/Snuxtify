@echo off
REM Setup script for MT5 Dashboard on Windows

echo Setting up MT5 Real-time Dashboard...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Start Redis
echo Starting Redis...
docker-compose up -d redis

REM Wait for Redis to start
timeout /t 3 /nobreak >nul

REM Check if Redis is running
docker ps | findstr "mt5-redis" >nul
if %errorlevel% equ 0 (
    echo ✓ Redis is running
) else (
    echo ✗ Failed to start Redis
    pause
    exit /b 1
)

REM Backend setup
echo Setting up backend...
cd backend

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo Error: Python is not installed. Please install Python 3.8+
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
    )
) else (
    set PYTHON_CMD=python
)

REM Install Python dependencies
echo Installing Python dependencies...
%PYTHON_CMD% -m pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file...
    copy .env .env >nul 2>&1
    echo ⚠️  Please edit backend\.env with your MT5 credentials
)

cd ..

REM Frontend setup
echo Setting up frontend...
cd frontend

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed. Please install Node.js 18+
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed. Please install npm
    pause
    exit /b 1
)

REM Install Node.js dependencies
echo Installing Node.js dependencies...
npm install

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local file...
    copy .env.example .env.local >nul 2>&1
)

cd ..

echo.
echo ✓ Setup complete!
echo.
echo Next steps:
echo 1. Edit backend\.env with your MT5 credentials
echo 2. Start the backend: cd backend ^&^& python main.py
echo 3. Start the frontend: cd frontend ^&^& npm run dev
echo 4. Open http://localhost:3000 in your browser
echo.
echo Redis is running on: localhost:6379
echo Backend will run on: http://localhost:8000
echo Frontend will run on: http://localhost:3000

pause
