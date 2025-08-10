#!/bin/bash

# Setup script for MT5 Dashboard

echo "Setting up MT5 Real-time Dashboard..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Start Redis
echo "Starting Redis..."
docker-compose up -d redis

# Check if Redis is running
sleep 3
if docker ps | grep -q "mt5-redis"; then
    echo "✓ Redis is running"
else
    echo "✗ Failed to start Redis"
    exit 1
fi

# Backend setup
echo "Setting up backend..."
cd backend

# Check if Python is installed
if ! command -v python &> /dev/null; then
    if ! command -v python3 &> /dev/null; then
        echo "Error: Python is not installed. Please install Python 3.8+"
        exit 1
    else
        PYTHON_CMD="python3"
    fi
else
    PYTHON_CMD="python"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
$PYTHON_CMD -m pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env || cp .env .env
    echo "⚠️  Please edit backend/.env with your MT5 credentials"
fi

cd ..

# Frontend setup
echo "Setting up frontend..."
cd frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install npm"
    exit 1
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
fi

cd ..

echo ""
echo "✓ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your MT5 credentials"
echo "2. Start the backend: cd backend && python main.py"
echo "3. Start the frontend: cd frontend && npm run dev"
echo "4. Open http://localhost:3000 in your browser"
echo ""
echo "Redis is running on: localhost:6379"
echo "Backend will run on: http://localhost:8000"
echo "Frontend will run on: http://localhost:3000"
