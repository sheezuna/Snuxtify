"""
Enhanced Pydantic models for the MT5 Trading System with comprehensive validation
"""

from pydantic import BaseModel, Field, validator, field_validator, model_validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TradeMode(int, Enum):
    """MT5 Trade modes"""
    DEMO = 0
    CONTEST = 1
    REAL = 2


class ConnectionState(str, Enum):
    """Connection states"""
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    ERROR = "error"


class HealthState(str, Enum):
    """Health check states"""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class AccountInfo(BaseModel):
    """Enhanced MT5 Account information model with validation"""
    login: int = Field(..., description="Account login number", gt=0)
    trade_mode: int = Field(..., description="Trade mode", ge=0, le=2)
    name: str = Field(..., description="Account holder name", min_length=1, max_length=100)
    server: str = Field(..., description="Trade server name", min_length=1, max_length=50)
    currency: str = Field(..., description="Account currency", min_length=3, max_length=3)
    leverage: int = Field(..., description="Account leverage", gt=0, le=10000)
    limit_orders: int = Field(..., description="Maximum allowed pending orders", ge=0)
    margin_so_mode: int = Field(..., description="Stop out mode", ge=0)
    trade_allowed: bool = Field(..., description="Trading allowed flag")
    trade_expert: bool = Field(..., description="Expert advisors allowed flag")
    margin_mode: int = Field(..., description="Margin calculation mode", ge=0)
    currency_digits: int = Field(..., description="Currency decimal places", ge=0, le=8)
    fifo_close: bool = Field(..., description="FIFO rule flag")
    balance: float = Field(..., description="Account balance")
    credit: float = Field(..., description="Account credit", ge=0)
    profit: float = Field(..., description="Current profit")
    equity: float = Field(..., description="Account equity")
    margin: float = Field(..., description="Used margin", ge=0)
    margin_free: float = Field(..., description="Free margin", ge=0)
    margin_level: float = Field(..., description="Margin level percentage", ge=0)
    margin_so_call: float = Field(..., description="Margin call level", ge=0)
    margin_so_so: float = Field(..., description="Stop out level", ge=0)
    margin_initial: float = Field(..., description="Initial margin", ge=0)
    margin_maintenance: float = Field(..., description="Maintenance margin", ge=0)
    assets: float = Field(..., description="Current assets", ge=0)
    liabilities: float = Field(..., description="Current liabilities", ge=0)
    commission_blocked: float = Field(..., description="Blocked commission", ge=0)
    last_update: datetime = Field(..., description="Last update timestamp")
    
    @validator('currency')
    def validate_currency(cls, v):
        """Validate currency code"""
        if not v.isupper():
            raise ValueError('Currency must be uppercase')
        return v
    
    @validator('margin_level')
    def validate_margin_level(cls, v):
        """Validate margin level - warn if too low"""
        if v < 100:
            # Could add warning logging here
            pass
        return v
    
    @model_validator(mode='before')
    def validate_account_consistency(cls, values):
        """Validate account data consistency"""
        if isinstance(values, dict):
            balance = values.get('balance', 0)
            equity = values.get('equity', 0)
            margin = values.get('margin', 0)
            margin_free = values.get('margin_free', 0)
            
            # Basic consistency checks
            if equity < 0 and balance >= 0:
                raise ValueError('Equity cannot be negative when balance is positive')
            
            if margin + margin_free > equity * 1.1:  # Allow small discrepancy
                raise ValueError('Margin calculations appear inconsistent')
        
        return values
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        schema_extra = {
            "example": {
                "login": 12345,
                "trade_mode": 0,
                "name": "Demo Account",
                "server": "MetaQuotes-Demo",
                "currency": "USD",
                "leverage": 500,
                "balance": 10000.0,
                "equity": 10000.0,
                "margin": 0.0,
                "margin_free": 10000.0,
                "last_update": "2025-08-10T12:00:00Z"
            }
        }


class MT5ConnectionStatus(BaseModel):
    """Enhanced MT5 connection status model"""
    connected: bool = Field(..., description="Connection status")
    message: str = Field(..., description="Status message", max_length=500)
    terminal_info: Optional[Dict[str, Any]] = Field(None, description="Terminal information")
    connection_state: ConnectionState = Field(default=ConnectionState.DISCONNECTED)
    last_ping: Optional[datetime] = Field(None, description="Last successful ping timestamp")
    retry_count: int = Field(default=0, description="Number of retry attempts", ge=0)
    
    @validator('message')
    def validate_message(cls, v):
        """Ensure message is not empty"""
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v.strip()
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class HealthStatus(BaseModel):
    """Enhanced application health status"""
    status: HealthState = Field(..., description="Overall health status")
    mt5_connected: bool = Field(..., description="MT5 connection status")
    redis_connected: bool = Field(..., description="Redis connection status")
    uptime_seconds: Optional[float] = Field(None, description="Uptime in seconds", ge=0)
    active_connections: int = Field(default=0, description="Active WebSocket connections", ge=0)
    last_check: datetime = Field(default_factory=datetime.now, description="Last health check timestamp")
    services: Optional[Dict[str, Dict[str, Any]]] = Field(None, description="Individual service health")
    memory_usage_mb: Optional[float] = Field(None, description="Memory usage in MB", ge=0)
    
    @model_validator(mode='before')
    def validate_overall_status(cls, values):
        """Determine overall status based on service states"""
        if isinstance(values, dict):
            mt5_connected = values.get('mt5_connected', False)
            redis_connected = values.get('redis_connected', False)
            
            if mt5_connected and redis_connected:
                status = HealthState.HEALTHY
            elif mt5_connected or redis_connected:
                status = HealthState.DEGRADED
            else:
                status = HealthState.UNHEALTHY
            
            values['status'] = status
        return values
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class WebSocketMessage(BaseModel):
    """Enhanced WebSocket message format with validation"""
    type: str = Field(..., description="Message type", min_length=1, max_length=50)
    data: Dict[str, Any] = Field(..., description="Message data")
    timestamp: datetime = Field(default_factory=datetime.now, description="Message timestamp")
    version: str = Field(default="1.0", description="Message format version")
    correlation_id: Optional[str] = Field(None, description="Correlation ID for tracking")
    
    @validator('type')
    def validate_message_type(cls, v):
        """Validate message type format"""
        allowed_types = {
            'account_update', 'connection_status', 'connection_connected',
            'connection_disconnected', 'welcome', 'heartbeat', 'pong', 'error'
        }
        if v not in allowed_types:
            raise ValueError(f'Invalid message type: {v}')
        return v
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ErrorResponse(BaseModel):
    """Standardized error response model"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.now)
    request_id: Optional[str] = Field(None, description="Request tracking ID")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
