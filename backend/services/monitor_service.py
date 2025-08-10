"""
Account monitoring service with event-driven architecture
"""

import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

from core.logger import get_logger
from core.event_manager import event_manager, Event
from services.mt5_service import MT5Service
from services.redis_service import RedisService
from services.websocket_manager import WebSocketConnectionManager
from utils.helpers import make_json_serializable

logger = get_logger(__name__)


class AccountMonitorService:
    """Enhanced account monitoring service with event-driven updates"""
    
    def __init__(
        self,
        mt5_service: MT5Service,
        redis_service: RedisService,
        websocket_manager: WebSocketConnectionManager
    ):
        self.mt5_service = mt5_service
        self.redis_service = redis_service
        self.websocket_manager = websocket_manager
        
        self._monitoring = False
        self._monitor_task: Optional[asyncio.Task] = None
        self._previous_account_data: Optional[Dict[str, Any]] = None
        self._mt5_was_connected = False
        self._error_count = 0
        self._max_errors = 5
        self._monitor_interval = 1.0  # seconds
    
    async def start_monitoring(self):
        """Start the account monitoring service"""
        if self._monitoring:
            logger.warning("Account monitoring already running")
            return
        
        self._monitoring = True
        self._monitor_task = asyncio.create_task(self._monitor_loop())
        logger.info("Account monitoring service started")
    
    async def stop_monitoring(self):
        """Stop the account monitoring service"""
        if not self._monitoring:
            return
        
        self._monitoring = False
        
        if self._monitor_task:
            self._monitor_task.cancel()
            try:
                await self._monitor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Account monitoring service stopped")
    
    async def _monitor_loop(self):
        """Main monitoring loop with enhanced error handling"""
        logger.info("Starting enhanced account monitor loop")
        
        while self._monitoring:
            try:
                await self._monitor_iteration()
                self._error_count = 0  # Reset error count on successful iteration
                
            except Exception as e:
                self._error_count += 1
                logger.error(f"Error in account monitor (count: {self._error_count}): {str(e)}")
                
                if self._error_count >= self._max_errors:
                    logger.critical(f"Too many errors in account monitor ({self._error_count}). Stopping.")
                    await self._emit_error_event(f"Monitor stopped due to {self._error_count} consecutive errors")
                    break
            
            # Wait before next iteration
            await asyncio.sleep(self._monitor_interval)
        
        logger.warning("Account monitor loop stopped")
    
    async def _monitor_iteration(self):
        """Single monitoring iteration"""
        # Check MT5 connection status
        is_connected = await self.mt5_service.health_check()
        
        # Handle connection status changes
        await self._handle_connection_status_change(is_connected)
        
        # Get account info if connected
        if is_connected:
            await self._handle_account_data_update()
    
    async def _handle_connection_status_change(self, is_connected: bool):
        """Handle MT5 connection status changes"""
        if not is_connected and self._mt5_was_connected:
            # Connection was lost
            logger.warning("MT5 connection lost")
            await self._emit_connection_event("disconnected", "MT5 connection lost")
            self._mt5_was_connected = False
            
        elif is_connected and not self._mt5_was_connected:
            # Connection restored
            logger.info("MT5 connection restored")
            await self._emit_connection_event("connected", "MT5 connection restored")
            self._mt5_was_connected = True
            self._error_count = 0  # Reset error count on successful connection
    
    async def _handle_account_data_update(self):
        """Handle account data updates"""
        current_account_info = await self.mt5_service.get_account_info()
        
        if current_account_info:
            current_data = current_account_info.model_dump()
            
            # Make data JSON serializable
            current_data = make_json_serializable(current_data)
            
            # Check if account data has changed
            if self._previous_account_data != current_data:
                logger.debug("Account data changed, publishing update")
                
                # Emit account update event
                await event_manager.emit(
                    "account_update",
                    current_data,
                    source="monitor_service"
                )
                
                self._previous_account_data = current_data
    
    async def _emit_connection_event(self, status: str, message: str):
        """Emit connection status event"""
        status_data = {
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
        
        await event_manager.emit(
            "connection_status",
            status_data,
            source="monitor_service"
        )
    
    async def _emit_error_event(self, error_message: str):
        """Emit error event"""
        error_data = {
            "error": error_message,
            "error_count": self._error_count,
            "timestamp": datetime.now().isoformat()
        }
        
        await event_manager.emit(
            "monitor_error",
            error_data,
            source="monitor_service"
        )
    
    def get_status(self) -> Dict[str, Any]:
        """Get monitoring service status"""
        return {
            "monitoring": self._monitoring,
            "mt5_connected": self._mt5_was_connected,
            "error_count": self._error_count,
            "max_errors": self._max_errors,
            "has_cached_data": self._previous_account_data is not None
        }
