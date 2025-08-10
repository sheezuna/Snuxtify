"""
Custom middleware for security, logging, and monitoring
"""

import time
import logging
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
from core.logger import get_logger

logger = get_logger(__name__)


class SecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced security middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Add security headers
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
        
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Enhanced request/response logging middleware"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log request
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        
        logger.info(f"Request: {request.method} {request.url.path} from {client_ip}")
        
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                f"Response: {response.status_code} for {request.method} {request.url.path} "
                f"({process_time:.3f}s)"
            )
            
            # Add processing time header
            response.headers["X-Process-Time"] = str(process_time)
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"Request failed: {request.method} {request.url.path} ({process_time:.3f}s) - {str(e)}")
            raise


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """Middleware for health check optimizations"""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Quick health check response without full processing
        if request.url.path in ["/health", "/ping"]:
            if request.method == "GET":
                return JSONResponse(
                    content={"status": "ok", "timestamp": time.time()},
                    status_code=200
                )
        
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple rate limiting middleware"""
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.requests = {}  # Simple in-memory store (use Redis in production)
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Clean old entries
        self._cleanup_old_entries(current_time)
        
        # Check rate limit
        if client_ip in self.requests:
            request_times = self.requests[client_ip]
            recent_requests = [t for t in request_times if current_time - t < self.period]
            
            if len(recent_requests) >= self.calls:
                logger.warning(f"Rate limit exceeded for {client_ip}")
                return JSONResponse(
                    content={"detail": "Rate limit exceeded"},
                    status_code=HTTP_429_TOO_MANY_REQUESTS
                )
            
            self.requests[client_ip] = recent_requests + [current_time]
        else:
            self.requests[client_ip] = [current_time]
        
        return await call_next(request)
    
    def _cleanup_old_entries(self, current_time: float):
        """Clean up old entries to prevent memory bloat"""
        for ip in list(self.requests.keys()):
            self.requests[ip] = [
                t for t in self.requests[ip] 
                if current_time - t < self.period
            ]
            if not self.requests[ip]:
                del self.requests[ip]
