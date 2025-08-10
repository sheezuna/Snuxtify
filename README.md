# MT5 Real-time Account Dashboard - Refactored

A modern, robust FastAPI backend service that connects to MetaTrader 5 (MT5) and serves real-time account data to a Next.js frontend using Redis Pub/Sub for real-time updates.

## 🚀 Features

- **Real-time Updates**: Uses Redis Pub/Sub to push account changes instantly to the frontend
- **No Polling**: WebSocket connection provides real-time data without polling mechanisms
- **MT5 Integration**: Direct connection to MetaTrader 5 terminal with robust error handling
- **Docker Redis**: Redis runs in a Docker container for easy setup
- **Modern Stack**: FastAPI backend with Next.js frontend
- **Enhanced Monitoring**: Comprehensive health checks and connection monitoring
- **Modular Architecture**: Clean, maintainable code structure
- **Error Resilience**: Advanced error handling and automatic reconnection

## 🏗️ Architecture

### Backend Structure
```
backend/
├── main.py                 # Main FastAPI application
├── models.py              # Pydantic models
├── redis_service.py       # Redis connection and pub/sub
├── services/
│   └── mt5_service.py     # MT5 connection and data retrieval
├── core/
│   ├── config.py          # Configuration management
│   ├── exceptions.py      # Custom exception classes
│   ├── logger.py          # Logging configuration
│   └── event_manager.py   # Event system
└── utils/
    ├── exceptions.py      # Utility exceptions
    └── helpers.py         # Helper functions
```

### Key Improvements
- **Modular Design**: Services are properly separated and organized
- **Configuration Management**: Centralized configuration with validation
- **Error Handling**: Comprehensive error handling with custom exceptions
- **Health Monitoring**: Built-in health checks for all services
- **Event System**: Event-driven architecture for better decoupling
- **Connection Management**: Robust connection handling with automatic reconnection

## 📋 Prerequisites

- Python 3.8+
- Node.js 18+
- Docker and Docker Compose
- MetaTrader 5 terminal installed and running

## 🚀 Quick Start

### 1. Start Redis

```bash
docker-compose up -d redis
```

### 2. Setup Backend

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Configure MT5 credentials
cp .env.example .env
# Edit .env with your MT5 login credentials

# Start the FastAPI server
python main.py
```

### 3. Setup Frontend

```bash
cd frontend

# Install Node.js dependencies
npm install

# Start the development server
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# MT5 Configuration
MT5_LOGIN=your_mt5_login_number
MT5_PASSWORD=your_mt5_password
MT5_SERVER=your_mt5_server

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# Application Configuration
APP_HOST=0.0.0.0
APP_PORT=8000
APP_DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
```

## 📚 API Endpoints

### Health & Status
- `GET /` - API information and status
- `GET /health` - Comprehensive health check
- `GET /connection-status` - MT5 connection status

### Account Data
- `GET /account` - Get current account information
- `POST /reconnect` - Manually trigger MT5 reconnection

### Real-time
- `WebSocket /ws` - Real-time updates and bidirectional communication

## 🔧 Development

### Running in Development Mode

```bash
# Backend with auto-reload
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Frontend with hot reload
cd frontend
npm run dev
```

### Project Structure

```
mt5-dashboard/
├── docker-compose.yml     # Redis container configuration
├── README.md             # This file
├── start_refactored.sh   # Startup script
├── backend/              # FastAPI backend
│   ├── main.py          # Main application
│   ├── models.py        # Data models
│   ├── requirements.txt # Python dependencies
│   ├── .env.example     # Environment template
│   ├── services/        # Service layer
│   ├── core/            # Core utilities
│   └── utils/           # Helper utilities
└── frontend/            # Next.js frontend
    ├── package.json     # Node.js dependencies
    ├── app/             # Next.js app directory
    ├── components/      # React components
    ├── hooks/           # Custom React hooks
    ├── lib/             # Utility libraries
    ├── services/        # API services
    └── types/           # TypeScript types
```

## 🎯 Key Improvements Made

### 1. **Modular Architecture**
- Separated concerns into dedicated modules
- Clear service boundaries
- Improved maintainability

### 2. **Robust Error Handling**
- Custom exception classes
- Comprehensive error logging
- Graceful error recovery

### 3. **Enhanced Configuration**
- Centralized configuration management
- Environment-based configuration
- Configuration validation

### 4. **Better Monitoring**
- Health check endpoints
- Connection status monitoring
- Performance metrics

### 5. **Code Quality**
- Removed duplicate code
- Consistent coding patterns
- Better documentation

### 6. **Reliability Improvements**
- Automatic reconnection logic
- Connection pooling
- Graceful shutdown handling

## 🔍 Monitoring & Debugging

### Health Checks
The system provides comprehensive health checks at `/health`:
- Overall system status
- MT5 connection status
- Redis connection status
- Service uptime

### Logging
Logs are structured and provide detailed information:
- Connection events
- Error conditions
- Performance metrics
- Debug information

### WebSocket Monitoring
Real-time connection monitoring via WebSocket:
- Connection status updates
- Account data changes
- Error notifications
- Heartbeat messages

## 🛠️ Troubleshooting

### Common Issues

1. **MT5 Connection Failed**
   - Verify MT5 terminal is running
   - Check credentials in `.env` file
   - Ensure MT5 allows API connections

2. **Redis Connection Failed**
   - Check if Docker is running
   - Verify Redis container status: `docker-compose ps`
   - Restart Redis: `docker-compose restart redis`

3. **Frontend Connection Issues**
   - Verify backend is running on port 8000
   - Check CORS configuration
   - Inspect browser console for errors

### Debug Mode
Enable debug mode by setting `APP_DEBUG=true` in your `.env` file.

## 🚀 Production Deployment

### Backend
```bash
# Install production dependencies
pip install -r requirements.txt

# Run with Gunicorn (recommended)
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Create an issue on the repository

# Start the Next.js development server
npm run dev
```

### 4. Access the Dashboard

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Architecture

```
┌─────────────────┐    WebSocket     ┌─────────────────┐
│                 │ ◄──────────────► │                 │
│   Next.js       │                  │   FastAPI       │
│   Frontend      │    HTTP API      │   Backend       │
│                 │ ◄──────────────► │                 │
└─────────────────┘                  └─────────────────┘
                                               │
                                               │ Redis Pub/Sub
                                               ▼
                                     ┌─────────────────┐
                                     │                 │
                                     │   Redis         │
                                     │   (Docker)      │
                                     │                 │
                                     └─────────────────┘
                                               ▲
                                               │ Account Data
                                               │
                                     ┌─────────────────┐
                                     │                 │
                                     │   MetaTrader 5  │
                                     │   Terminal      │
                                     │                 │
                                     └─────────────────┘
```

## Configuration

### Backend Configuration (.env)

```env
# MT5 Connection Settings
MT5_LOGIN=your_mt5_login
MT5_PASSWORD=your_mt5_password
MT5_SERVER=your_mt5_server

# Redis Settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# FastAPI Settings
API_HOST=0.0.0.0
API_PORT=8000
```

### Frontend Configuration (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Service health status
- `GET /mt5/status` - MT5 connection status
- `POST /mt5/connect` - Connect to MT5
- `POST /mt5/disconnect` - Disconnect from MT5
- `GET /account` - Get current account info from MT5
- `GET /account/cached` - Get cached account info from Redis
- `WebSocket /ws` - Real-time account updates

## Real-time Updates

The system provides real-time updates through:

1. **Background Monitoring**: FastAPI continuously monitors MT5 account changes
2. **Redis Pub/Sub**: Changes are published to Redis channels
3. **WebSocket Broadcasting**: All connected clients receive updates instantly
4. **No Polling**: Frontend receives data push notifications only

## Development

### Backend Development

```bash
cd backend

# Install in development mode
pip install -r requirements.txt

# Run with auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### Redis Management

```bash
# Start Redis
docker-compose up -d redis

# Stop Redis
docker-compose down

# View Redis logs
docker-compose logs redis

# Access Redis CLI
docker exec -it mt5-redis redis-cli
```

## Troubleshooting

### Common Issues

1. **MT5 Connection Failed**
   - Ensure MT5 terminal is running
   - Check login credentials in `.env`
   - Verify server name is correct

2. **Redis Connection Failed**
   - Start Redis with `docker-compose up -d redis`
   - Check if port 6379 is available

3. **WebSocket Connection Failed**
   - Ensure FastAPI backend is running
   - Check CORS settings for your frontend URL

4. **No Real-time Updates**
   - Check WebSocket connection status
   - Verify Redis is running and accessible
   - Check browser console for errors

### Logs

Backend logs provide detailed information about:
- MT5 connection status
- Redis pub/sub activity
- WebSocket connections
- Account data changes

## Security Notes

- Never commit MT5 credentials to version control
- Use environment variables for all sensitive configuration
- Consider implementing authentication for production use
- Secure Redis instance in production environments

## License

This project is provided as-is for educational and development purposes.
