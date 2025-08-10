# MT5 Trading System Frontend

A modern, responsive frontend for the MT5 Trading System built with Next.js, TypeScript, and Tailwind CSS.

## Features

This frontend is fully integrated with the backend services and only implements features that are available in the backend:

### ✅ Available Features

1. **Real-time WebSocket Connection**
   - Live account data updates
   - Connection status monitoring
   - Automatic reconnection handling

2. **MT5 Connection Management**
   - View connection status
   - Reconnect to MT5 terminal
   - Connection health monitoring

3. **Account Information Display**
   - Real-time account balance
   - Equity, margin, and profit data
   - Account permissions and settings
   - Complete MT5 account details

4. **System Health Monitoring**
   - Backend connectivity status
   - WebSocket connection health
   - Error tracking and display

### 🚫 Not Available (Backend Limitations)

- Manual disconnect functionality (no backend endpoint)
- Settings configuration (no backend endpoint)
- Trading operations (not implemented in backend)
- Historical data charts (no backend data)
- Order management (not implemented)

## Backend Integration

The frontend communicates with the backend using:

### REST API Endpoints
- `GET /` - System information
- `GET /health` - Health check
- `GET /account` - Account information
- `GET /connection-status` - MT5 connection status
- `POST /reconnect` - Reconnect to MT5

### WebSocket Connection
- `ws://localhost:8000/ws` - Real-time data stream
- Receives account updates, connection status changes
- Handles heartbeat and connection management

## Data Flow

1. **Initial Load**: Fetches connection status via REST API
2. **Real-time Updates**: WebSocket provides live account data
3. **User Actions**: Connection controls trigger backend API calls
4. **Error Handling**: Graceful fallback and retry mechanisms

## Development

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
```

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
```

## User Interface

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Automatic theme detection
- **Real-time Updates**: Live data without page refresh
- **Error States**: Clear error messages and recovery options
- **Loading States**: Smooth loading indicators

## Clean Architecture

- Components only use data available from backend
- No hardcoded fake data or placeholder values
- Proper error handling for all API calls
- Type-safe integration with backend models
