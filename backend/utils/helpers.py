"""
Helper utilities
"""

import asyncio
import json
from datetime import datetime
from typing import Any, Dict

def make_json_serializable(data: Dict[str, Any]) -> Dict[str, Any]:
    """Convert non-serializable objects to serializable format"""
    serializable_data = {}
    for key, value in data.items():
        if isinstance(value, datetime):
            serializable_data[key] = value.isoformat()
        elif hasattr(value, 'isoformat'):  # datetime-like objects
            serializable_data[key] = value.isoformat()
        else:
            serializable_data[key] = value
    return serializable_data

def safe_json_dumps(data: Any, **kwargs) -> str:
    """Safely serialize data to JSON with datetime handling"""
    return json.dumps(data, default=str, **kwargs)

async def safe_async_call(coro, timeout: float = 5.0, default=None):
    """Safely call an async function with timeout"""
    try:
        return await asyncio.wait_for(coro, timeout=timeout)
    except asyncio.TimeoutError:
        return default
    except Exception:
        return default

class AsyncContextManager:
    """Helper for managing async context managers"""
    
    def __init__(self, async_context_manager):
        self._acm = async_context_manager
        self._entered = None
    
    async def __aenter__(self):
        self._entered = await self._acm.__aenter__()
        return self._entered
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        return await self._acm.__aexit__(exc_type, exc_val, exc_tb)
