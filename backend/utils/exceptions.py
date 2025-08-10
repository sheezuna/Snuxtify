"""
Custom exceptions for the MT5 Trading System
"""

class MT5TradingSystemException(Exception):
    """Base exception for the MT5 Trading System"""
    pass

class MT5ConnectionError(MT5TradingSystemException):
    """Raised when MT5 connection fails"""
    pass

class MT5AuthenticationError(MT5TradingSystemException):
    """Raised when MT5 authentication fails"""
    pass

class RedisConnectionError(MT5TradingSystemException):
    """Raised when Redis connection fails"""
    pass

class ConfigurationError(MT5TradingSystemException):
    """Raised when configuration is invalid"""
    pass

class ServiceNotInitializedError(MT5TradingSystemException):
    """Raised when a service is not properly initialized"""
    pass
