"""
Event management system for real-time updates
"""

import asyncio
import json
from typing import Any, Callable, Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class Event:
    """Event data structure"""
    type: str
    data: Any
    timestamp: float
    source: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary"""
        return {
            'type': self.type,
            'data': self.data,
            'timestamp': self.timestamp,
            'source': self.source
        }
    
    def to_json(self) -> str:
        """Convert event to JSON string"""
        return json.dumps(self.to_dict(), default=str)

class EventManager:
    """Event-driven system for managing real-time updates"""
    
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}
        self._queue = asyncio.Queue()
        self._running = False
        self._processor_task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the event processor"""
        if self._running:
            return
        
        self._running = True
        self._processor_task = asyncio.create_task(self._process_events())
        logger.info("Event manager started")
    
    async def stop(self):
        """Stop the event processor"""
        if not self._running:
            return
        
        self._running = False
        
        if self._processor_task:
            self._processor_task.cancel()
            try:
                await self._processor_task
            except asyncio.CancelledError:
                pass
        
        logger.info("Event manager stopped")
    
    def subscribe(self, event_type: str, callback: Callable[[Event], None]):
        """Subscribe to events of a specific type"""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        
        self._subscribers[event_type].append(callback)
        logger.debug(f"Subscribed to event type: {event_type}")
    
    def unsubscribe(self, event_type: str, callback: Callable[[Event], None]):
        """Unsubscribe from events"""
        if event_type in self._subscribers:
            try:
                self._subscribers[event_type].remove(callback)
                logger.debug(f"Unsubscribed from event type: {event_type}")
            except ValueError:
                pass
    
    async def emit(self, event_type: str, data: Any, source: Optional[str] = None):
        """Emit an event"""
        event = Event(
            type=event_type,
            data=data,
            timestamp=asyncio.get_event_loop().time(),
            source=source
        )
        
        await self._queue.put(event)
        logger.debug(f"Event emitted: {event_type}")
    
    async def _process_events(self):
        """Process events from the queue"""
        while self._running:
            try:
                # Wait for events with a timeout to allow for shutdown
                event = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                
                # Notify subscribers
                if event.type in self._subscribers:
                    for callback in self._subscribers[event.type]:
                        try:
                            if asyncio.iscoroutinefunction(callback):
                                await callback(event)
                            else:
                                callback(event)
                        except Exception as e:
                            logger.error(f"Error in event callback: {e}")
                
            except asyncio.TimeoutError:
                # Timeout is expected for shutdown checks
                continue
            except Exception as e:
                logger.error(f"Error processing event: {e}")

# Global event manager instance
event_manager = EventManager()
