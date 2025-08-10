"""
Enhanced Redis service with proper error handling and connection pooling
"""

import json
import logging
import asyncio
from typing import Optional, Any, Dict
from contextlib import asynccontextmanager

try:
    import redis.asyncio as redis
except ImportError:
    redis = None

from core.config import RedisConfig
from core.exceptions import ServiceConnectionError

logger = logging.getLogger(__name__)


class RedisService:
    """Enhanced Redis service with connection pooling and error handling"""
    
    def __init__(self, config: RedisConfig):
        self.config = config
        self._redis_client = None
        self._connected = False
        self._connection_pool = None
    
    async def connect(self) -> bool:
        """Initialize Redis connection with connection pooling"""
        if redis is None:
            logger.warning("redis package not available, Redis functionality disabled")
            return False
        
        try:
            # Create connection pool for better performance
            self._connection_pool = redis.ConnectionPool(
                host=self.config.host,
                port=self.config.port,
                db=self.config.db,
                password=self.config.password,
                decode_responses=True,
                max_connections=10,
                retry_on_timeout=True,
                socket_keepalive=True,
                socket_keepalive_options={}
            )
            
            self._redis_client = redis.Redis(connection_pool=self._connection_pool)
            
            # Test connection
            await self._redis_client.ping()
            self._connected = True
            logger.info(f"Redis connected successfully to {self.config.host}:{self.config.port}")
            return True
            
        except Exception as e:
            logger.error(f"Redis connection failed: {e}")
            self._connected = False
            await self._cleanup()
            return False
    
    async def disconnect(self):
        """Gracefully disconnect from Redis"""
        await self._cleanup()
        logger.info("Redis disconnected")
    
    async def _cleanup(self):
        """Clean up Redis connections"""
        if self._redis_client:
            try:
                await self._redis_client.aclose()
            except Exception as e:
                logger.warning(f"Error closing Redis client: {e}")
        
        if self._connection_pool:
            try:
                await self._connection_pool.aclose()
            except Exception as e:
                logger.warning(f"Error closing Redis connection pool: {e}")
        
        self._redis_client = None
        self._connection_pool = None
        self._connected = False
    
    async def health_check(self) -> bool:
        """Check Redis connection health"""
        if not self._connected or not self._redis_client:
            return False
        
        try:
            await self._redis_client.ping()
            return True
        except Exception as e:
            logger.warning(f"Redis health check failed: {e}")
            self._connected = False
            return False
    
    @asynccontextmanager
    async def get_client(self):
        """Context manager for Redis client with automatic error handling"""
        if not self._connected or not self._redis_client:
            raise ServiceConnectionError("Redis not connected")
        
        try:
            yield self._redis_client
        except Exception as e:
            logger.error(f"Redis operation failed: {e}")
            # Try to reconnect on error
            if not await self.health_check():
                await self.connect()
            raise
    
    async def publish(self, channel: str, data: Any) -> bool:
        """Publish data to Redis channel with error handling"""
        if not self._connected:
            logger.debug("Redis not connected, skipping publish")
            return False
        
        try:
            async with self.get_client() as client:
                message = json.dumps(data) if not isinstance(data, str) else data
                await client.publish(channel, message)
                logger.debug(f"Published to {channel}: {len(message)} chars")
                return True
        except Exception as e:
            logger.error(f"Failed to publish to {channel}: {e}")
            return False
    
    async def publish_account_update(self, data: Dict[str, Any]) -> bool:
        """Publish account update to MT5 account updates channel"""
        return await self.publish("mt5_account_updates", data)
    
    async def publish_connection_status(self, data: Dict[str, Any]) -> bool:
        """Publish status update to MT5 status updates channel"""
        return await self.publish("mt5_status_updates", data)
    
    async def set_cache(self, key: str, value: Any, expire_seconds: Optional[int] = None) -> bool:
        """Set cache value with optional expiration"""
        if not self._connected:
            return False
        
        try:
            async with self.get_client() as client:
                data = json.dumps(value) if not isinstance(value, str) else value
                if expire_seconds:
                    await client.setex(key, expire_seconds, data)
                else:
                    await client.set(key, data)
                return True
        except Exception as e:
            logger.error(f"Failed to set cache {key}: {e}")
            return False
    
    async def get_cache(self, key: str) -> Optional[Any]:
        """Get cache value"""
        if not self._connected:
            return None
        
        try:
            async with self.get_client() as client:
                data = await client.get(key)
                if data:
                    try:
                        return json.loads(data)
                    except json.JSONDecodeError:
                        return data
                return None
        except Exception as e:
            logger.error(f"Failed to get cache {key}: {e}")
            return None
    
    def is_connected(self) -> bool:
        """Check if Redis is connected"""
        return self._connected
    
    def get_connection_info(self) -> Dict[str, Any]:
        """Get Redis connection information"""
        return {
            "connected": self._connected,
            "host": self.config.host,
            "port": self.config.port,
            "db": self.config.db,
            "has_password": bool(self.config.password)
        }
