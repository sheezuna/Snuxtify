"""
Service manager for dependency injection and service lifecycle management
"""

from typing import Optional
from core.config import settings
from core.logger import get_logger
from core.event_manager import event_manager
from core.exceptions import ServiceNotInitializedError

# Service imports
from services.mt5_service import MT5Service
from services.redis_service import RedisService
from services.websocket_service import WebSocketManager
from services.monitor_service import AccountMonitorService

logger = get_logger(__name__)


class ServiceManager:
    """Centralized service management with dependency injection"""
    
    def __init__(self):
        self.mt5_service: Optional[MT5Service] = None
        self.redis_service: Optional[RedisService] = None
        self.websocket_manager: Optional[WebSocketManager] = None
        self.monitor_service: Optional[AccountMonitorService] = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize all services with proper dependency injection"""
        if self._initialized:
            logger.warning("Services already initialized")
            return
        
        try:
            logger.info("Initializing services...")
            
            # Initialize Redis service
            self.redis_service = RedisService(settings.redis)
            await self.redis_service.connect()
            logger.info("Redis service initialized")
            
            # Initialize MT5 service
            self.mt5_service = MT5Service(settings.mt5)
            mt5_status = await self.mt5_service.connect()
            if mt5_status.connected:
                logger.info("MT5 service connected successfully")
            else:
                logger.warning(f"MT5 connection failed: {mt5_status.message}")
            
            # Initialize WebSocket manager
            self.websocket_manager = WebSocketManager()
            logger.info("WebSocket manager initialized")
            
            # Initialize monitor service with dependencies
            self.monitor_service = AccountMonitorService(
                self.mt5_service,
                self.redis_service,
                self.websocket_manager
            )
            
            # Set up event listeners
            await self._setup_event_listeners()
            
            # Start event manager
            await event_manager.start()
            
            # Start monitoring
            await self.monitor_service.start_monitoring()
            
            self._initialized = True
            logger.info("All services initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize services: {e}")
            await self.cleanup()
            raise
    
    async def cleanup(self):
        """Clean up all services"""
        if not self._initialized:
            return
        
        logger.info("Shutting down services...")
        
        try:
            # Stop monitoring
            if self.monitor_service:
                await self.monitor_service.stop_monitoring()
            
            # Stop event manager
            await event_manager.stop()
            
            # Disconnect services
            if self.mt5_service:
                await self.mt5_service.disconnect()
            
            if self.redis_service:
                await self.redis_service.disconnect()
            
            self._initialized = False
            logger.info("All services shut down successfully")
            
        except Exception as e:
            logger.error(f"Error during service cleanup: {e}")
    
    async def _setup_event_listeners(self):
        """Setup event listeners for cross-service communication"""
        
        # Account update event listener
        async def handle_account_update(event):
            """Handle account update events"""
            try:
                # Publish to Redis
                if self.redis_service:
                    await self.redis_service.publish_account_update(event.data)
                
                # Broadcast via WebSocket
                if self.websocket_manager:
                    await self.websocket_manager.broadcast_event(event)
                    
            except Exception as e:
                logger.error(f"Error handling account update event: {e}")
        
        # Connection status event listener  
        async def handle_connection_status(event):
            """Handle connection status events"""
            try:
                # Publish to Redis
                if self.redis_service:
                    await self.redis_service.publish_connection_status(event.data)
                
                # Broadcast via WebSocket
                if self.websocket_manager:
                    await self.websocket_manager.broadcast_event(event)
                    
            except Exception as e:
                logger.error(f"Error handling connection status event: {e}")
        
        # Monitor error event listener
        async def handle_monitor_error(event):
            """Handle monitor error events"""
            try:
                # Log error and broadcast via WebSocket
                logger.error(f"Monitor error: {event.data}")
                if self.websocket_manager:
                    await self.websocket_manager.broadcast_event(event)
                    
            except Exception as e:
                logger.error(f"Error handling monitor error event: {e}")
        
        # Register event listeners
        event_manager.subscribe("account_update", handle_account_update)
        event_manager.subscribe("connection_status", handle_connection_status)
        event_manager.subscribe("monitor_error", handle_monitor_error)
        
        logger.info("Event listeners configured")
    
    def get_mt5_service(self) -> MT5Service:
        """Get MT5 service with validation"""
        if not self.mt5_service:
            raise ServiceNotInitializedError("MT5 service not initialized")
        return self.mt5_service
    
    def get_redis_service(self) -> RedisService:
        """Get Redis service with validation"""
        if not self.redis_service:
            raise ServiceNotInitializedError("Redis service not initialized")
        return self.redis_service
    
    def get_websocket_manager(self) -> WebSocketManager:
        """Get WebSocket manager with validation"""
        if not self.websocket_manager:
            raise ServiceNotInitializedError("WebSocket manager not initialized")
        return self.websocket_manager
    
    def get_monitor_service(self) -> AccountMonitorService:
        """Get monitor service with validation"""
        if not self.monitor_service:
            raise ServiceNotInitializedError("Monitor service not initialized")
        return self.monitor_service
    
    def is_initialized(self) -> bool:
        """Check if services are initialized"""
        return self._initialized


# Global service manager instance
service_manager = ServiceManager()
