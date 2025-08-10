"""
Enhanced MT5 Service with robust error handling and monitoring
"""

import MetaTrader5 as mt5
import asyncio
import logging
from datetime import datetime
from typing import Optional

from models import AccountInfo, MT5ConnectionStatus, ConnectionState
from core.exceptions import MT5ConnectionError, MT5AuthenticationError

logger = logging.getLogger(__name__)


class MT5Service:
    """Enhanced MT5 service with robust connection management and monitoring"""
    
    def __init__(self, config):
        self.config = config
        self._connected = False
        self._connection_lock = asyncio.Lock()
        self._last_account_info: Optional[AccountInfo] = None
        self._connection_attempts = 0
        self._max_connection_attempts = 3
        self._last_ping: Optional[datetime] = None
    
    async def connect(self) -> MT5ConnectionStatus:
        """Initialize connection to MT5 terminal with proper error handling"""
        async with self._connection_lock:
            if self._connected and self.is_connected():
                return MT5ConnectionStatus(
                    connected=True,
                    message="Already connected to MT5",
                    terminal_info=None,
                    connection_state=ConnectionState.CONNECTED,
                    last_ping=self._last_ping,
                    retry_count=self._connection_attempts
                )
            
            try:
                # Initialize MT5
                if not mt5.initialize():
                    error_code, error_desc = mt5.last_error()
                    error_msg = f"MT5 initialization failed: {error_desc} (Code: {error_code})"
                    logger.error(error_msg)
                    raise MT5ConnectionError(error_msg)
                
                # Authenticate
                login_result = mt5.login(
                    login=self.config.login,
                    password=self.config.password,
                    server=self.config.server
                )
                
                if not login_result:
                    error_code, error_desc = mt5.last_error()
                    error_msg = f"MT5 authentication failed: {error_desc} (Code: {error_code})"
                    logger.error(error_msg)
                    mt5.shutdown()
                    raise MT5AuthenticationError(error_msg)
                
                self._connected = True
                self._connection_attempts = 0
                self._last_ping = datetime.now()
                terminal_info = await self._get_terminal_info()
                
                logger.info(f"Successfully connected to MT5 - Login: {self.config.login}")
                return MT5ConnectionStatus(
                    connected=True,
                    message="Successfully connected to MT5",
                    terminal_info=terminal_info,
                    connection_state=ConnectionState.CONNECTED,
                    last_ping=self._last_ping,
                    retry_count=self._connection_attempts
                )
                
            except (MT5ConnectionError, MT5AuthenticationError):
                self._connection_attempts += 1
                raise
            except Exception as e:
                error_msg = f"Unexpected error during MT5 connection: {str(e)}"
                logger.error(error_msg)
                self._connected = False
                self._connection_attempts += 1
                return MT5ConnectionStatus(
                    connected=False, 
                    message=error_msg,
                    terminal_info=None,
                    connection_state=ConnectionState.ERROR,
                    last_ping=None,
                    retry_count=self._connection_attempts
                )
    
    async def disconnect(self) -> None:
        """Safely disconnect from MT5 terminal"""
        async with self._connection_lock:
            if self._connected:
                try:
                    mt5.shutdown()
                    self._connected = False
                    self._last_account_info = None
                    self._last_ping = None
                    logger.info("Disconnected from MT5")
                except Exception as e:
                    logger.error(f"Error during MT5 disconnect: {e}")
    
    async def get_account_info(self) -> Optional[AccountInfo]:
        """Get current account information with error handling and caching"""
        if not self.is_connected():
            logger.warning("Cannot get account info: MT5 not connected")
            return self._last_account_info
        
        try:
            account_info = mt5.account_info()
            if account_info is None:
                error_code, error_desc = mt5.last_error()
                logger.error(f"Failed to get account info: {error_desc} (Code: {error_code})")
                return self._last_account_info
            
            # Convert to dict and add timestamp
            account_dict = account_info._asdict()
            account_dict['last_update'] = datetime.now()
            
            # Update ping time
            self._last_ping = datetime.now()
            
            self._last_account_info = AccountInfo(**account_dict)
            return self._last_account_info
            
        except Exception as e:
            logger.error(f"Exception getting account info: {str(e)}")
            return self._last_account_info
    
    def is_connected(self) -> bool:
        """Check if MT5 is connected and terminal is available"""
        if not self._connected:
            return False
        
        try:
            # Double-check with terminal info
            terminal_info = mt5.terminal_info()
            is_connected = terminal_info is not None
            
            if not is_connected:
                self._connected = False
                logger.warning("MT5 connection lost (terminal_info returned None)")
            else:
                self._last_ping = datetime.now()
            
            return is_connected
        except Exception as e:
            self._connected = False
            logger.error(f"Error checking MT5 connection: {e}")
            return False
    
    async def _get_terminal_info(self) -> Optional[dict]:
        """Get terminal information safely"""
        try:
            terminal_info = mt5.terminal_info()
            return terminal_info._asdict() if terminal_info else None
        except Exception as e:
            logger.warning(f"Could not get terminal info: {e}")
            return None
    
    async def health_check(self) -> bool:
        """Perform a comprehensive health check on the MT5 connection"""
        if not self.is_connected():
            return False
        
        try:
            # Try to get account info as a health check
            account_info = await self.get_account_info()
            return account_info is not None
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    def get_connection_status(self) -> dict:
        """Get current connection status"""
        return {
            "connected": self._connected,
            "retry_count": self._connection_attempts,
            "last_ping": self._last_ping.isoformat() if self._last_ping else None,
            "last_account_update": self._last_account_info.last_update.isoformat() if self._last_account_info else None
        }
    
    async def reconnect(self) -> MT5ConnectionStatus:
        """Attempt to reconnect to MT5"""
        if self._connection_attempts >= self._max_connection_attempts:
            error_msg = f"Max reconnection attempts ({self._max_connection_attempts}) reached"
            logger.error(error_msg)
            return MT5ConnectionStatus(
                connected=False, 
                message=error_msg,
                terminal_info=None,
                connection_state=ConnectionState.ERROR,
                last_ping=None,
                retry_count=self._connection_attempts
            )
        
        logger.info(f"Attempting to reconnect to MT5 (attempt {self._connection_attempts + 1}/{self._max_connection_attempts})")
        
        # Disconnect first
        await self.disconnect()
        
        # Wait a bit before reconnecting
        await asyncio.sleep(2)
        
        # Try to connect again
        return await self.connect()
