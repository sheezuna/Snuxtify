"""
Enhanced WebSocket manager with connection pooling, heartbeat, and proper error handling
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class WebSocketConnectionManager:
    """Advanced WebSocket connection manager with enhanced features"""
    
    def __init__(self, heartbeat_interval: int = 30):
        self.active_connections: List[WebSocket] = []
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}
        self._heartbeat_interval = heartbeat_interval
        self._heartbeat_task: Optional[asyncio.Task] = None
        self._message_queue: asyncio.Queue = asyncio.Queue()
        self._broadcast_task: Optional[asyncio.Task] = None
    
    async def connect(self, websocket: WebSocket, client_info: Optional[Dict[str, Any]] = None) -> bool:
        """Accept new WebSocket connection with metadata tracking"""
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            
            # Store client metadata
            self.connection_metadata[websocket] = {
                "connected_at": datetime.now(),
                "client_info": client_info or {},
                "message_count": 0,
                "last_activity": datetime.now()
            }
            
            logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
            
            # Start background tasks if first connection
            if len(self.active_connections) == 1:
                await self._start_background_tasks()
            
            # Send welcome message
            await self._send_welcome_message(websocket)
            return True
            
        except Exception as e:
            logger.error(f"Failed to accept WebSocket connection: {e}")
            return False
    
    async def disconnect(self, websocket: WebSocket, reason: str = "Unknown") -> None:
        """Remove WebSocket connection and clean up metadata"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
            # Clean up metadata
            if websocket in self.connection_metadata:
                metadata = self.connection_metadata.pop(websocket)
                duration = datetime.now() - metadata["connected_at"]
                logger.info(f"WebSocket disconnected. Reason: {reason}. "
                          f"Duration: {duration.total_seconds():.1f}s. "
                          f"Messages: {metadata['message_count']}. "
                          f"Remaining: {len(self.active_connections)}")
            
            # Stop background tasks if no connections
            if not self.active_connections:
                await self._stop_background_tasks()
    
    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket) -> bool:
        """Send message to specific WebSocket connection"""
        try:
            message_str = json.dumps(message, default=str)
            await websocket.send_text(message_str)
            
            # Update metadata
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["message_count"] += 1
                self.connection_metadata[websocket]["last_activity"] = datetime.now()
            
            return True
            
        except WebSocketDisconnect:
            await self.disconnect(websocket, "Client disconnected")
            return False
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
            await self.disconnect(websocket, f"Send error: {e}")
            return False
    
    async def broadcast_message(self, message: Dict[str, Any], exclude: Optional[List[WebSocket]] = None) -> int:
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return 0
        
        exclude = exclude or []
        message_str = json.dumps(message, default=str)
        successful_sends = 0
        failed_connections = []
        
        for websocket in self.active_connections:
            if websocket in exclude:
                continue
                
            try:
                await websocket.send_text(message_str)
                
                # Update metadata
                if websocket in self.connection_metadata:
                    self.connection_metadata[websocket]["message_count"] += 1
                    self.connection_metadata[websocket]["last_activity"] = datetime.now()
                
                successful_sends += 1
                
            except WebSocketDisconnect:
                failed_connections.append((websocket, "Client disconnected"))
            except Exception as e:
                logger.warning(f"Failed to send broadcast message: {e}")
                failed_connections.append((websocket, f"Send error: {e}"))
        
        # Clean up failed connections
        for websocket, reason in failed_connections:
            await self.disconnect(websocket, reason)
        
        logger.debug(f"Broadcast sent to {successful_sends}/{len(self.active_connections)} connections")
        return successful_sends
    
    async def send_to_queue(self, message: Dict[str, Any]) -> None:
        """Add message to broadcast queue for async processing"""
        await self._message_queue.put(message)
    
    async def _start_background_tasks(self) -> None:
        """Start background tasks for heartbeat and message broadcasting"""
        if not self._heartbeat_task or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            logger.info("WebSocket heartbeat task started")
        
        if not self._broadcast_task or self._broadcast_task.done():
            self._broadcast_task = asyncio.create_task(self._broadcast_loop())
            logger.info("WebSocket broadcast task started")
    
    async def _stop_background_tasks(self) -> None:
        """Stop background tasks"""
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()
            try:
                await self._heartbeat_task
            except asyncio.CancelledError:
                pass
            logger.info("WebSocket heartbeat task stopped")
        
        if self._broadcast_task and not self._broadcast_task.done():
            self._broadcast_task.cancel()
            try:
                await self._broadcast_task
            except asyncio.CancelledError:
                pass
            logger.info("WebSocket broadcast task stopped")
    
    async def _heartbeat_loop(self) -> None:
        """Send periodic heartbeat messages to maintain connections"""
        while self.active_connections:
            try:
                heartbeat_message = {
                    "type": "heartbeat",
                    "data": {
                        "timestamp": datetime.now().isoformat(),
                        "connections": len(self.active_connections)
                    }
                }
                
                await self.broadcast_message(heartbeat_message)
                await asyncio.sleep(self._heartbeat_interval)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                await asyncio.sleep(5)
    
    async def _broadcast_loop(self) -> None:
        """Process queued broadcast messages"""
        while True:
            try:
                # Wait for message with timeout
                message = await asyncio.wait_for(self._message_queue.get(), timeout=1.0)
                await self.broadcast_message(message)
                self._message_queue.task_done()
                
            except asyncio.TimeoutError:
                # Check if we should continue running
                if not self.active_connections:
                    break
                continue
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Broadcast loop error: {e}")
                await asyncio.sleep(1)
    
    async def _send_welcome_message(self, websocket: WebSocket) -> None:
        """Send welcome message to newly connected client"""
        welcome_message = {
            "type": "welcome",
            "data": {
                "message": "Connected to MT5 Trading System",
                "timestamp": datetime.now().isoformat(),
                "server_version": "3.0.0"
            }
        }
        await self.send_personal_message(welcome_message, websocket)
    
    async def handle_client_message(self, websocket: WebSocket, message: str) -> None:
        """Handle incoming message from client"""
        try:
            data = json.loads(message)
            message_type = data.get("type", "unknown")
            
            # Update last activity
            if websocket in self.connection_metadata:
                self.connection_metadata[websocket]["last_activity"] = datetime.now()
            
            # Handle different message types
            if message_type == "ping":
                response = {
                    "type": "pong",
                    "data": {
                        "timestamp": datetime.now().isoformat(),
                        "message": "pong"
                    }
                }
                await self.send_personal_message(response, websocket)
                
            elif message_type == "subscribe":
                # Handle subscription requests
                channel = data.get("channel")
                if channel:
                    logger.info(f"Client subscribed to channel: {channel}")
                    # Add subscription logic here
                    
            elif message_type == "unsubscribe":
                # Handle unsubscription requests
                channel = data.get("channel")
                if channel:
                    logger.info(f"Client unsubscribed from channel: {channel}")
                    # Add unsubscription logic here
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.warning(f"Invalid JSON received from WebSocket: {message}")
        except Exception as e:
            logger.error(f"Error handling client message: {e}")
    
    def get_connection_count(self) -> int:
        """Get current number of active connections"""
        return len(self.active_connections)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get detailed connection statistics"""
        if not self.connection_metadata:
            return {
                "total_connections": 0,
                "average_duration": 0,
                "total_messages": 0
            }
        
        now = datetime.now()
        durations = []
        total_messages = 0
        
        for metadata in self.connection_metadata.values():
            duration = (now - metadata["connected_at"]).total_seconds()
            durations.append(duration)
            total_messages += metadata["message_count"]
        
        return {
            "total_connections": len(self.active_connections),
            "average_duration": sum(durations) / len(durations) if durations else 0,
            "total_messages": total_messages,
            "average_messages_per_connection": total_messages / len(durations) if durations else 0
        }
    
    async def cleanup(self) -> None:
        """Clean up all connections and tasks"""
        logger.info("Cleaning up WebSocket manager...")
        
        # Stop background tasks
        await self._stop_background_tasks()
        
        # Close all connections
        for websocket in self.active_connections.copy():
            try:
                await websocket.close()
            except Exception as e:
                logger.warning(f"Error closing WebSocket: {e}")
        
        self.active_connections.clear()
        self.connection_metadata.clear()
        logger.info("WebSocket manager cleanup complete")
