"""
Enhanced validation utilities and decorators
"""

import functools
import asyncio
from typing import Optional, Callable, Any, Dict
from datetime import datetime, timedelta
from fastapi import HTTPException, status
from pydantic import BaseModel, validator, ValidationError
from core.logger import get_logger
from core.exceptions import ValidationError as CustomValidationError

logger = get_logger(__name__)


class RequestValidator(BaseModel):
    """Base request validator with common fields"""
    timestamp: Optional[datetime] = None
    
    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        return v or datetime.now()


class CircuitBreaker:
    """Circuit breaker pattern implementation"""
    
    def __init__(self, failure_threshold: int = 5, timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    def __call__(self, func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            if self.state == "OPEN":
                if self._should_attempt_reset():
                    self.state = "HALF_OPEN"
                    logger.info(f"Circuit breaker for {func.__name__} moving to HALF_OPEN")
                else:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail=f"Service temporarily unavailable: {func.__name__}"
                    )
            
            try:
                result = await func(*args, **kwargs)
                self._on_success()
                return result
            except Exception as e:
                self._on_failure()
                raise
        
        return wrapper
    
    def _should_attempt_reset(self) -> bool:
        if not self.last_failure_time:
            return False
        return datetime.now() - self.last_failure_time > timedelta(seconds=self.timeout)
    
    def _on_success(self):
        self.failure_count = 0
        self.state = "CLOSED"
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")


def validate_request(validator_class):
    """Decorator for request validation"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                # Validate request if present
                if 'request' in kwargs:
                    request_data = kwargs.get('request')
                    if request_data and hasattr(request_data, 'json'):
                        json_data = await request_data.json()
                        validated_data = validator_class.parse_obj(json_data)
                        kwargs['validated_data'] = validated_data
                
                return await func(*args, **kwargs)
            except ValidationError as e:
                logger.error(f"Validation error in {func.__name__}: {e}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=str(e)
                )
            except Exception as e:
                logger.error(f"Unexpected error in {func.__name__}: {e}")
                raise
        
        return wrapper
    return decorator


def timeout_handler(timeout_seconds: float = 10.0):
    """Decorator for handling async function timeouts"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(func(*args, **kwargs), timeout=timeout_seconds)
            except asyncio.TimeoutError:
                logger.error(f"Timeout in {func.__name__} after {timeout_seconds}s")
                raise HTTPException(
                    status_code=status.HTTP_408_REQUEST_TIMEOUT,
                    detail=f"Operation timed out after {timeout_seconds} seconds"
                )
        return wrapper
    return decorator


def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying failed operations with exponential backoff"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            current_delay = delay
            
            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries:
                        logger.error(f"Final failure in {func.__name__} after {max_retries} retries: {e}")
                        raise
                    
                    logger.warning(f"Attempt {attempt + 1} failed in {func.__name__}: {e}. Retrying in {current_delay}s")
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
            
        return wrapper
    return decorator


class HealthChecker:
    """Health checking utility for services"""
    
    def __init__(self):
        self.checks: Dict[str, Callable] = {}
    
    def register_check(self, name: str, check_func: Callable):
        """Register a health check function"""
        self.checks[name] = check_func
    
    async def run_all_checks(self) -> Dict[str, Dict[str, Any]]:
        """Run all registered health checks"""
        results = {}
        
        for name, check_func in self.checks.items():
            try:
                start_time = datetime.now()
                is_healthy = await check_func()
                duration = (datetime.now() - start_time).total_seconds()
                
                results[name] = {
                    "healthy": is_healthy,
                    "duration_ms": round(duration * 1000, 2),
                    "timestamp": start_time.isoformat()
                }
            except Exception as e:
                results[name] = {
                    "healthy": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
        
        return results


# Global instances
mt5_circuit_breaker = CircuitBreaker(failure_threshold=5, timeout=60)
redis_circuit_breaker = CircuitBreaker(failure_threshold=3, timeout=30)
health_checker = HealthChecker()
