"""
Enhanced Redis pub/sub service for real-time data distribution
"""

import json
import logging
import asyncio
from typing import Optional, Any, Dict, Callable, List
from datetime import datetime

try:
    import redis.asyncio as redis
except ImportError:
    redis = None

from core.config import RedisConfig, RealtimeConfig
from core.exceptions import ServiceConnectionError

logger = logging.getLogger(__name__)


class RedisPubSubService:
    """Redis pub/sub service for real-time data distribution"""
    
    def __init__(self, config: RedisConfig, realtime_config: RealtimeConfig):
        self.config = config
        self.realtime_config = realtime_config
        self._redis_client = None
        self._pub_client = None
        self._sub_client = None
        self._connected = False
        self._connection_pool = None
        self._subscribers: Dict[str, List[Callable]] = {}
        self._subscription_tasks: Dict[str, asyncio.Task] = {}
    
    async def connect(self) -> bool:
        """Initialize Redis connection with connection pooling"""
        if redis is None:
            logger.warning("redis package not available, Redis pub/sub functionality disabled")
            return False
        
        try:
            # Create connection pool for better performance
            self._connection_pool = redis.ConnectionPool(
                host=self.config.host,
                port=self.config.port,
                db=self.config.db,
                password=self.config.password,
                decode_responses=True,
                max_connections=20,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={},
                health_check_interval=30
            )
            
            # Create separate clients for pub/sub and regular operations
            self._redis_client = redis.Redis(connection_pool=self._connection_pool)
            self._pub_client = redis.Redis(connection_pool=self._connection_pool)
            self._sub_client = redis.Redis(connection_pool=self._connection_pool)
            
            # Test connection
            await self._redis_client.ping()
            self._connected = True
            
            logger.info(f"Connected to Redis pub/sub at {self.config.host}:{self.config.port}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to Redis pub/sub: {e}")
            self._connected = False
            return False
    
    async def disconnect(self) -> None:
        """Close Redis connections and cleanup"""
        try:
            # Cancel all subscription tasks
            for task in self._subscription_tasks.values():
                if not task.done():
                    task.cancel()
                    try:
                        await task
                    except asyncio.CancelledError:
                        pass
            
            self._subscription_tasks.clear()
            self._subscribers.clear()
            
            # Close connections
            if self._redis_client:
                await self._redis_client.close()
            if self._pub_client:
                await self._pub_client.close()
            if self._sub_client:
                await self._sub_client.close()
            
            # Close connection pool
            if self._connection_pool:
                await self._connection_pool.disconnect()
            
            self._connected = False
            logger.info("Disconnected from Redis pub/sub")
            
        except Exception as e:
            logger.error(f"Error disconnecting from Redis pub/sub: {e}")
    
    async def publish(self, channel: str, data: Any) -> bool:
        """Publish data to Redis channel"""
        if not self._connected or not self._pub_client:
            logger.warning("Redis not connected, cannot publish")
            return False
        
        try:
            # Add channel prefix
            full_channel = f"{self.realtime_config.redis_channel_prefix}:{channel}"
            
            # Serialize data
            if isinstance(data, (dict, list)):
                message = json.dumps(data, default=str)
            else:
                message = str(data)
            
            # Publish message
            result = await self._pub_client.publish(full_channel, message)
            logger.debug(f"Published to {full_channel}: {len(message)} bytes, {result} subscribers")
            return result > 0
            
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            return False
    
    async def subscribe(self, channel: str, callback: Callable[[str, Any], None]) -> bool:
        """Subscribe to Redis channel with callback"""
        if not self._connected or not self._sub_client:
            logger.warning("Redis not connected, cannot subscribe")
            return False
        
        try:
            full_channel = f"{self.realtime_config.redis_channel_prefix}:{channel}"
            
            # Add callback to subscribers
            if full_channel not in self._subscribers:
                self._subscribers[full_channel] = []
            self._subscribers[full_channel].append(callback)
            
            # Start subscription task if not already running
            if full_channel not in self._subscription_tasks:
                task = asyncio.create_task(self._subscription_handler(full_channel))
                self._subscription_tasks[full_channel] = task
            
            logger.info(f"Subscribed to {full_channel}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to subscribe to {channel}: {e}")
            return False
    
    async def unsubscribe(self, channel: str, callback: Optional[Callable] = None) -> bool:
        """Unsubscribe from Redis channel"""
        try:
            full_channel = f"{self.realtime_config.redis_channel_prefix}:{channel}"
            
            if full_channel in self._subscribers:
                if callback:
                    # Remove specific callback
                    if callback in self._subscribers[full_channel]:
                        self._subscribers[full_channel].remove(callback)
                else:
                    # Remove all callbacks
                    self._subscribers[full_channel].clear()
                
                # If no more callbacks, cancel subscription task
                if not self._subscribers[full_channel]:
                    if full_channel in self._subscription_tasks:
                        task = self._subscription_tasks.pop(full_channel)
                        if not task.done():
                            task.cancel()
                            try:
                                await task
                            except asyncio.CancelledError:
                                pass
                    
                    del self._subscribers[full_channel]
                    logger.info(f"Unsubscribed from {full_channel}")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to unsubscribe from {channel}: {e}")
            return False
    
    async def _subscription_handler(self, channel: str) -> None:
        """Handle subscription messages for a channel"""
        pubsub = None
        try:
            if not self._sub_client:
                logger.error("Redis subscription client not available")
                return
                
            pubsub = self._sub_client.pubsub()
            await pubsub.subscribe(channel)
            
            logger.info(f"Started subscription handler for {channel}")
            
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        # Parse message data
                        data = message['data']
                        if isinstance(data, str):
                            try:
                                parsed_data = json.loads(data)
                            except json.JSONDecodeError:
                                parsed_data = data
                        else:
                            parsed_data = data
                        
                        # Call all subscribers
                        if channel in self._subscribers:
                            for callback in self._subscribers[channel]:
                                try:
                                    if asyncio.iscoroutinefunction(callback):
                                        await callback(channel, parsed_data)
                                    else:
                                        callback(channel, parsed_data)
                                except Exception as e:
                                    logger.error(f"Error in subscription callback: {e}")
                        
                    except Exception as e:
                        logger.error(f"Error processing message from {channel}: {e}")
                        
        except asyncio.CancelledError:
            logger.info(f"Subscription handler for {channel} cancelled")
            raise
        except Exception as e:
            logger.error(f"Subscription handler error for {channel}: {e}")
        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe(channel)
                    await pubsub.close()
                except Exception as e:
                    logger.error(f"Error closing pubsub for {channel}: {e}")
    
    # Publishing convenience methods for common data types
    async def publish_account_update(self, account_data: Dict[str, Any]) -> bool:
        """Publish account update"""
        return await self.publish(self.realtime_config.account_update_channel, {
            "type": "account_update",
            "data": account_data,
            "timestamp": datetime.now().isoformat()
        })
    
    async def publish_market_data(self, symbol: str, market_data: Dict[str, Any]) -> bool:
        """Publish market data update"""
        return await self.publish(self.realtime_config.market_data_channel, {
            "type": "market_data",
            "symbol": symbol,
            "data": market_data,
            "timestamp": datetime.now().isoformat()
        })
    
    async def publish_position_update(self, position_data: Dict[str, Any]) -> bool:
        """Publish position update"""
        return await self.publish(self.realtime_config.position_update_channel, {
            "type": "position_update",
            "data": position_data,
            "timestamp": datetime.now().isoformat()
        })
    
    async def publish_order_update(self, order_data: Dict[str, Any]) -> bool:
        """Publish order update"""
        return await self.publish(self.realtime_config.order_update_channel, {
            "type": "order_update",
            "data": order_data,
            "timestamp": datetime.now().isoformat()
        })
    
    async def publish_connection_status(self, status_data: Dict[str, Any]) -> bool:
        """Publish connection status update"""
        return await self.publish("connection_status", {
            "type": "connection_status",
            "data": status_data,
            "timestamp": datetime.now().isoformat()
        })
    
    def is_connected(self) -> bool:
        """Check if Redis pub/sub is connected"""
        return self._connected
    
    def get_subscriber_count(self, channel: str) -> int:
        """Get number of subscribers for a channel"""
        full_channel = f"{self.realtime_config.redis_channel_prefix}:{channel}"
        return len(self._subscribers.get(full_channel, []))
    
    def get_stats(self) -> Dict[str, Any]:
        """Get pub/sub statistics"""
        return {
            "connected": self._connected,
            "active_subscriptions": len(self._subscription_tasks),
            "total_subscribers": sum(len(subs) for subs in self._subscribers.values()),
            "channels": list(self._subscribers.keys())
        }
