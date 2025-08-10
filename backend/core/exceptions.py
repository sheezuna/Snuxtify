"""
Custom exceptions for the MT5 Trading System
"""


class MT5TradingSystemError(Exception):
    """Base exception for the MT5 Trading System"""
    pass


class MT5ConnectionError(MT5TradingSystemError):
    """MT5 connection related errors"""
    pass


class MT5AuthenticationError(MT5TradingSystemError):
    """MT5 authentication related errors"""
    pass


class RedisConnectionError(MT5TradingSystemError):
    """Redis connection related errors"""
    pass


class ServiceConnectionError(MT5TradingSystemError):
    """General service connection errors"""
    pass


class ConfigurationError(MT5TradingSystemError):
    """Configuration related errors"""
    pass


class ValidationError(MT5TradingSystemError):
    """Data validation errors"""
    pass


class BusinessLogicError(MT5TradingSystemError):
    """Business logic validation errors"""
    pass


class ServiceNotInitializedError(MT5TradingSystemError):
    """Service not properly initialized"""
    pass
