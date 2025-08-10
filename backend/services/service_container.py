"""
Service layer for dependency injection and service management
"""

import asyncio
import logging
from typing import Optional
from datetime import datetime

from .mt5_service import MT5Service
from .redis_service import RedisService
from .websocket_manager import WebSocketConnectionManager
from core.config import Settings
from core.event_manager import EventManager

logger = logging.getLogger(__name__)


class ServiceContainer:
    """Service container for dependency injection and lifecycle management"""
    
    def __init__(self, settings: Settings):
        self.settings = settings
        
        # Core services
        self.mt5_service: Optional[MT5Service] = None
        self.redis_service: Optional[RedisService] = None
        self.websocket_manager: Optional[WebSocketConnectionManager] = None
        self.event_manager: Optional[EventManager] = None
        
        # Lifecycle tracking
        self._initialized = False
        self._startup_time: Optional[datetime] = None
        self._monitor_task: Optional[asyncio.Task] = None
    
    async def initialize(self) -> None:
        """Initialize all services"""
        if self._initialized:
            logger.warning("Service container already initialized")
            return
        
        logger.info("Initializing service container...")
        self._startup_time = datetime.now()
        
        try:
            # Initialize services in dependency order
            await self._initialize_redis()
            await self._initialize_websocket_manager()
            await self._initialize_event_manager()
            await self._initialize_mt5_service()
            
            # Start monitoring
            await self._start_monitoring()
            
            self._initialized = True
            logger.info("Service container initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize service container: {e}")
            await self.cleanup()
            raise
    
    async def cleanup(self) -> None:
        """Clean up all services"""
        logger.info("Cleaning up service container...")
        
        # Stop monitoring
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        
        # Cleanup services in reverse order
        if self.event_manager:
            try:
                await self.event_manager.stop()
            except Exception as e:
                logger.warning(f"Error stopping event manager: {e}")
        
        if self.mt5_service:
            await self.mt5_service.disconnect()
        
        if self.websocket_manager:
            await self.websocket_manager.cleanup()
        
        if self.redis_service:
            await self.redis_service.disconnect()
        
        self._initialized = False
        logger.info("Service container cleanup complete")
    
    async def _initialize_redis(self) -> None:
        """Initialize Redis service"""
        logger.info("Initializing Redis service...")
        self.redis_service = RedisService(self.settings.redis)
        await self.redis_service.connect()
        logger.info("Redis service initialized")
    
    async def _initialize_websocket_manager(self) -> None:
        """Initialize WebSocket manager"""
        logger.info("Initializing WebSocket manager...")
        self.websocket_manager = WebSocketConnectionManager(heartbeat_interval=30)
        logger.info("WebSocket manager initialized")
    
    async def _initialize_event_manager(self) -> None:
        """Initialize event manager"""
        logger.info("Initializing event manager...")
        try:
            from core.event_manager import event_manager
            self.event_manager = event_manager
            await self.event_manager.start()
            logger.info("Event manager initialized")
        except ImportError as e:
            logger.warning(f"Event manager not available: {e}")
            # Create a dummy event manager if import fails
            self.event_manager = None
    
    async def _initialize_mt5_service(self) -> None:
        """Initialize MT5 service"""
        logger.info("Initializing MT5 service...")
        self.mt5_service = MT5Service(self.settings.mt5)
        status = await self.mt5_service.connect()
        
        if status.connected:
            logger.info("MT5 service connected successfully")
        else:
            logger.warning(f"MT5 service connection failed: {status.message}")
        
        logger.info("MT5 service initialized")
    
    async def _start_monitoring(self) -> None:
        """Start the monitoring task"""
        logger.info("Starting service monitoring...")
        self._monitor_task = asyncio.create_task(self._monitor_services())
    
    async def _monitor_services(self) -> None:
        """Monitor all services and handle account updates"""
        logger.info("Service monitoring started")
        previous_account_data = None
        mt5_was_connected = False
        error_count = 0
        
        while True:
            try:
                # Check MT5 connection status
                is_connected = (self.mt5_service and 
                              await self.mt5_service.health_check())
                is_connected = bool(is_connected)  # Ensure boolean type
                
                # Handle connection status changes
                if is_connected != mt5_was_connected:
                    await self._handle_connection_change(is_connected)
                    mt5_was_connected = is_connected
                    error_count = 0
                
                # Process account updates if connected
                if is_connected and self.mt5_service:
                    account_info = await self.mt5_service.get_account_info()
                    if account_info:
                        current_data = account_info.model_dump()
                        
                        # Convert datetime to string for serialization
                        if 'last_update' in current_data:
                            current_data['last_update'] = current_data['last_update'].isoformat()
                        
                        # Check if data changed
                        if previous_account_data != current_data:
                            await self._handle_account_update(current_data)
                            previous_account_data = current_data
                
                error_count = 0
                
            except Exception as e:
                error_count += 1
                logger.error(f"Service monitoring error (count: {error_count}): {e}")
                
                if error_count >= 5:
                    logger.critical("Too many monitoring errors. Stopping monitoring.")
                    break
            
            await asyncio.sleep(1)
    
    async def _handle_connection_change(self, is_connected: bool) -> None:
        """Handle MT5 connection status changes"""
        status = "connected" if is_connected else "disconnected"
        message = f"MT5 {status}"
        
        logger.info(message)
        
        status_data = {
            "status": status,
            "connected": is_connected,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        # Publish to Redis
        if self.redis_service:
            await self.redis_service.publish_connection_status(status_data)
        
        # Broadcast via WebSocket
        if self.websocket_manager:
            websocket_message = {
                "type": f"connection_{status}",
                "data": status_data
            }
            await self.websocket_manager.send_to_queue(websocket_message)
        
        # Emit event
        if self.event_manager:
            try:
                await self.event_manager.emit(f"mt5_connection_{status}", status_data)
            except Exception as e:
                logger.warning(f"Error emitting event: {e}")
    
    async def _handle_account_update(self, account_data: dict) -> None:
        """Handle account information updates"""
        # Publish to Redis
        if self.redis_service:
            await self.redis_service.publish_account_update(account_data)
        
        # Broadcast via WebSocket
        if self.websocket_manager:
            websocket_message = {
                "type": "account_update",
                "data": account_data,
                "timestamp": datetime.now().isoformat()
            }
            await self.websocket_manager.send_to_queue(websocket_message)
        
        # Emit event
        if self.event_manager:
            try:
                await self.event_manager.emit("account_updated", account_data)
            except Exception as e:
                logger.warning(f"Error emitting event: {e}")
    
    def get_health_status(self) -> dict:
        """Get health status of all services"""
        uptime = datetime.now() - self._startup_time if self._startup_time else None
        
        return {
            "initialized": self._initialized,
            "uptime_seconds": uptime.total_seconds() if uptime else 0,
            "services": {
                "mt5": {
                    "available": self.mt5_service is not None,
                    "connected": (self.mt5_service and 
                                asyncio.create_task(self.mt5_service.health_check()).done() and
                                asyncio.create_task(self.mt5_service.health_check()).result()) if self.mt5_service else False
                },
                "redis": {
                    "available": self.redis_service is not None,
                    "connected": self.redis_service.is_connected if self.redis_service else False
                },
                "websocket": {
                    "available": self.websocket_manager is not None,
                    "connections": self.websocket_manager.get_connection_count() if self.websocket_manager else 0
                },
                "event_manager": {
                    "available": self.event_manager is not None,
                    "running": getattr(self.event_manager, '_running', False) if self.event_manager else False
                }
            }
        }
    
    def is_healthy(self) -> bool:
        """Check if all critical services are healthy"""
        if not self._initialized:
            return False
        
        # MT5 service is optional for health
        redis_healthy = self.redis_service and self.redis_service.is_connected
        websocket_healthy = self.websocket_manager is not None
        event_manager_healthy = self.event_manager is None or getattr(self.event_manager, '_running', False)
        
        return bool(redis_healthy and websocket_healthy and event_manager_healthy)


# Global service container instance
service_container: Optional[ServiceContainer] = None


def get_service_container() -> ServiceContainer:
    """Get the global service container instance"""
    if service_container is None:
        raise RuntimeError("Service container not initialized")
    return service_container


def initialize_service_container(settings: Settings) -> ServiceContainer:
    """Initialize the global service container"""
    global service_container
    service_container = ServiceContainer(settings)
    return service_container
