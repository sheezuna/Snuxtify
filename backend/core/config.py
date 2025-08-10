"""
Configuration management for the MT5 Trading System
"""

import os
from typing import Optional
from dataclasses import dataclass
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class ConfigurationError(Exception):
    """Configuration related errors"""
    pass


@dataclass
class MT5Config:
    """MT5 connection configuration"""
    login: int
    password: str
    server: str
    
    @classmethod
    def from_env(cls) -> 'MT5Config':
        """Create configuration from environment variables"""
        try:
            login = int(os.getenv('MT5_LOGIN', 0))
            password = os.getenv('MT5_PASSWORD', '')
            server = os.getenv('MT5_SERVER', '')
            
            config = cls(login=login, password=password, server=server)
            if not config.is_valid():
                raise ConfigurationError("Invalid MT5 configuration: missing required fields")
            
            return config
        except ValueError as e:
            raise ConfigurationError(f"Invalid MT5 configuration: {e}")
    
    def is_valid(self) -> bool:
        """Check if configuration is valid"""
        return all([self.login, self.password, self.server])


@dataclass
class RedisConfig:
    """Redis connection configuration"""
    host: str
    port: int
    db: int
    password: Optional[str] = None
    
    @classmethod
    def from_env(cls) -> 'RedisConfig':
        """Create configuration from environment variables"""
        try:
            return cls(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                db=int(os.getenv('REDIS_DB', 0)),
                password=os.getenv('REDIS_PASSWORD')
            )
        except ValueError as e:
            raise ConfigurationError(f"Invalid Redis configuration: {e}")


@dataclass
class AppConfig:
    """Application configuration"""
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    cors_origins: Optional[list[str]] = None
    log_level: str = "INFO"
    
    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ["http://localhost:3000"]
    
    @classmethod
    def from_env(cls) -> 'AppConfig':
        """Create configuration from environment variables"""
        try:
            return cls(
                host=os.getenv('APP_HOST', '0.0.0.0'),
                port=int(os.getenv('APP_PORT', 8000)),
                debug=os.getenv('APP_DEBUG', 'false').lower() == 'true',
                cors_origins=os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(','),
                log_level=os.getenv('LOG_LEVEL', 'INFO').upper()
            )
        except ValueError as e:
            raise ConfigurationError(f"Invalid App configuration: {e}")


class Settings:
    """Central settings management"""
    
    def __init__(self):
        self.mt5 = MT5Config.from_env()
        self.redis = RedisConfig.from_env()
        self.app = AppConfig.from_env()
    
    def validate(self) -> tuple[bool, list[str]]:
        """Validate all configurations"""
        errors = []
        
        if not self.mt5.is_valid():
            errors.append("Invalid MT5 configuration")
        
        if not (1 <= self.redis.port <= 65535):
            errors.append(f"Invalid Redis port: {self.redis.port}")
            
        if not (1 <= self.app.port <= 65535):
            errors.append(f"Invalid application port: {self.app.port}")
        
        return len(errors) == 0, errors


# Global settings instance
settings = Settings()
