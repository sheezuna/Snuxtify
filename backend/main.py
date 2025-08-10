import asyncio
import json
import logging
import uvicorn
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional, Any, Dict, List

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from pydantic import BaseModel

from models import AccountInfo, MT5ConnectionStatus, HealthStatus, HealthState
from services.service_container import initialize_service_container, get_service_container
from core.config import settings
from core.logger import setup_logging, get_logger
from core.exceptions import MT5TradingSystemError
from core.middleware import SecurityMiddleware, LoggingMiddleware, HealthCheckMiddleware, RateLimitMiddleware

# Setup logging
setup_logging(settings.app.log_level)
logger = get_logger(__name__)

# Global startup time
startup_time = datetime.now()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management with service container"""
    logger.info("Starting MT5 Trading System...")

    try:
        is_valid, errors = settings.validate()
        if not is_valid:
            logger.critical(f"Configuration validation failed: {errors}")
            raise ValueError("Invalid configuration")

        container = initialize_service_container(settings)
        await container.initialize()

        logger.info("All services started successfully")
        yield

    except Exception as e:
        logger.critical(f"Failed to initialize: {e}", exc_info=True)
        raise
    finally:
        logger.info("Shutting down...")
        try:
            container = get_service_container()
            if container:
                await container.cleanup()
        except Exception as e:
            logger.error(f"Error during cleanup: {e}", exc_info=True)
        logger.info("Shutdown complete")


# Create FastAPI application
app = FastAPI(
    title="MT5 Trading System",
    description="Production-ready real-time MT5 account monitoring with enhanced security",
    version="3.1.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.app.debug else None,
    redoc_url="/redoc" if settings.app.debug else None
)

# Add middleware
app.add_middleware(SecurityMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(HealthCheckMiddleware)
app.add_middleware(RateLimitMiddleware, calls=100, period=60)

if not settings.app.debug:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.app.cors_origins or ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time"]
)


# --- Centralized Exception Handlers ---
@app.exception_handler(MT5TradingSystemError)
async def mt5_trading_system_error_handler(request: Request, exc: MT5TradingSystemError):
    logger.error(f"MT5 Trading System Error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=getattr(exc, "status_code", 500),
        content={"detail": str(exc)}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {type(exc).__name__}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


# --- API Endpoints ---
class RootResponse(BaseModel):
    name: str
    version: str
    status: str
    uptime_seconds: float
    websocket: str
    health: str
    active_connections: int

@app.get("/", response_model=RootResponse)
async def root():
    """Root endpoint providing system status information"""
    container = get_service_container()
    uptime = (datetime.now() - startup_time).total_seconds()
    connection_count = container.websocket_manager.get_connection_count() if container and container.websocket_manager else 0

    return RootResponse(
        name="MT5 Trading System",
        version="3.1.0",
        status="running",
        uptime_seconds=uptime,
        websocket="/ws",
        health="/health",
        active_connections=connection_count
    )


@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Health check endpoint with detailed service status"""
    container = get_service_container()
    if not container:
        uptime = (datetime.now() - startup_time).total_seconds()
        return HealthStatus(
            status=HealthState.UNHEALTHY,
            mt5_connected=False,
            redis_connected=False,
            uptime_seconds=uptime,
            services={"mt5": {"status": "degraded"}, "redis": {"status": "degraded"}},
            memory_usage_mb=0.0
        )

    mt5_healthy = await container.mt5_service.health_check() if container.mt5_service else False
    redis_healthy = await container.redis_service.health_check() if container.redis_service else False

    overall_status = HealthState.HEALTHY if mt5_healthy and redis_healthy else HealthState.UNHEALTHY
    uptime = (datetime.now() - startup_time).total_seconds()

    return HealthStatus(
        status=overall_status,
        mt5_connected=mt5_healthy,
        redis_connected=redis_healthy,
        uptime_seconds=uptime,
        services={
            "mt5": {"status": "healthy" if mt5_healthy else "degraded"},
            "redis": {"status": "healthy" if redis_healthy else "degraded"}
        },
        memory_usage_mb=0.0
    )


@app.get("/account", response_model=AccountInfo)
async def get_account_info():
    """Get account information from the connected MT5 terminal"""
    container = get_service_container()
    if not container or not container.mt5_service:
        raise HTTPException(status_code=503, detail="MT5 service not available")
    if not await container.mt5_service.health_check():
        raise HTTPException(status_code=503, detail="MT5 not connected")

    account_info = await container.mt5_service.get_account_info()
    if not account_info:
        raise HTTPException(status_code=503, detail="Failed to get account information from MT5")

    return account_info


@app.get("/connection-status", response_model=MT5ConnectionStatus)
async def get_connection_status():
    """Get MT5 connection status"""
    container = get_service_container()
    if not container or not container.mt5_service:
        raise HTTPException(status_code=503, detail="MT5 service not initialized")

    is_connected = await container.mt5_service.health_check()
    connection_info = container.mt5_service.get_connection_status()

    return MT5ConnectionStatus(
        connected=is_connected,
        message="Connected" if is_connected else "Disconnected",
        terminal_info=connection_info,
        last_ping=getattr(container.mt5_service, "last_ping", None)
    )


@app.post("/reconnect", response_model=MT5ConnectionStatus)
async def reconnect_mt5():
    """Reconnect to the MT5 terminal"""
    container = get_service_container()
    if not container or not container.mt5_service:
        raise HTTPException(status_code=503, detail="MT5 service not available")

    return await container.mt5_service.reconnect()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    container = get_service_container()
    if not container or not container.websocket_manager:
        await websocket.close(code=1011, reason="WebSocket service not available")
        return

    client_info = {
        "client": websocket.client.host if websocket.client else "unknown",
        "user_agent": websocket.headers.get("user-agent", "unknown")
    }

    try:
        await container.websocket_manager.connect(websocket, client_info)

        if container.mt5_service:
            is_connected = await container.mt5_service.health_check()
            status_message = {
                "type": "connection_status",
                "data": {"connected": is_connected, "message": "Connected to WebSocket"},
                "timestamp": datetime.now().isoformat()
            }
            await container.websocket_manager.send_personal_message(status_message, websocket)

        last_pong = datetime.now()
        ping_interval = timedelta(seconds=20)

        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                if message == "pong":
                    last_pong = datetime.now()
                    continue
                await container.websocket_manager.handle_client_message(websocket, message)
            except asyncio.TimeoutError:
                if datetime.now() - last_pong > ping_interval:
                    await websocket.send_text("ping")
                    last_pong = datetime.now()
            except WebSocketDisconnect:
                logger.info("WebSocket disconnected normally")
                break
            except Exception as e:
                logger.error(f"WebSocket message handling error: {e}", exc_info=True)
                await websocket.send_text(json.dumps({"error": "An internal error occurred"}))
                break

    except Exception as e:
        logger.error(f"WebSocket endpoint error: {e}", exc_info=True)
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except Exception:
            pass
    finally:
        await container.websocket_manager.disconnect(websocket, "Connection closed")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.app.host,
        port=settings.app.port,
        log_level=settings.app.log_level.lower(),
        reload=settings.app.debug
    )