#!/usr/bin/env python3
"""
System startup script for MT5 Trading Bot
Starts Redis, Backend, and Frontend services without using any timers
"""

import asyncio
import subprocess
import sys
import os
import signal
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SystemManager:
    def __init__(self):
        self.processes = []
        self.should_shutdown = False
        
    async def start_redis(self):
        """Start Redis using Docker"""
        logger.info("Starting Redis with Docker...")
        try:
            # Start Redis container
            cmd = ["docker", "run", "-d", "--name", "trading-redis", "-p", "6379:6379", "redis:alpine"]
            process = await asyncio.create_subprocess_exec(*cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                logger.info("Redis started successfully")
                return True
            else:
                logger.error(f"Failed to start Redis: {stderr.decode()}")
                return False
                
        except Exception as e:
            logger.error(f"Error starting Redis: {e}")
            return False
    
    async def start_backend(self):
        """Start FastAPI backend"""
        logger.info("Starting Backend...")
        try:
            backend_dir = Path("backend")
            if not backend_dir.exists():
                logger.error("Backend directory not found")
                return None
                
            # Start backend
            cmd = [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
            process = await asyncio.create_subprocess_exec(
                *cmd, 
                cwd=backend_dir,
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE
            )
            
            logger.info(f"Backend started with PID: {process.pid}")
            return process
            
        except Exception as e:
            logger.error(f"Error starting backend: {e}")
            return None
    
    async def start_frontend(self):
        """Start Next.js frontend"""
        logger.info("Starting Frontend...")
        try:
            frontend_dir = Path("frontend")
            if not frontend_dir.exists():
                logger.error("Frontend directory not found")
                return None
            
            # Install dependencies first
            logger.info("Installing frontend dependencies...")
            install_process = await asyncio.create_subprocess_exec(
                "npm", "install",
                cwd=frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            await install_process.communicate()
            
            if install_process.returncode != 0:
                logger.error("Failed to install frontend dependencies")
                return None
            
            # Start frontend
            cmd = ["npm", "run", "dev"]
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=frontend_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            logger.info(f"Frontend started with PID: {process.pid}")
            return process
            
        except Exception as e:
            logger.error(f"Error starting frontend: {e}")
            return None
    
    async def monitor_processes(self):
        """Monitor running processes and restart if needed (event-driven, no timers)"""
        logger.info("Starting process monitor...")
        
        while not self.should_shutdown:
            try:
                # Check if any process has exited
                for i, process in enumerate(self.processes):
                    if process and process.returncode is not None:
                        logger.warning(f"Process {i} (PID: {process.pid}) has exited with code {process.returncode}")
                        # Remove the dead process
                        self.processes[i] = None
                
                # Use asyncio.Event for proper async waiting instead of sleep
                shutdown_event = asyncio.Event()
                
                # Wait for shutdown signal or process exit
                done, pending = await asyncio.wait([
                    asyncio.create_task(shutdown_event.wait()),
                    *[asyncio.create_task(p.wait()) for p in self.processes if p and p.returncode is None]
                ], return_when=asyncio.FIRST_COMPLETED)
                
                # Cancel pending tasks
                for task in pending:
                    task.cancel()
                    
                # If we reach here, either shutdown was requested or a process died
                if self.should_shutdown:
                    break
                    
                logger.info("Process exited, checking system state...")
                
            except Exception as e:
                logger.error(f"Error in process monitor: {e}")
                await asyncio.sleep(1)  # Only sleep on error
    
    async def shutdown(self):
        """Gracefully shutdown all services"""
        logger.info("Shutting down system...")
        self.should_shutdown = True
        
        # Terminate all processes
        for process in self.processes:
            if process and process.returncode is None:
                try:
                    process.terminate()
                    await asyncio.wait_for(process.wait(), timeout=5.0)
                except asyncio.TimeoutError:
                    logger.warning(f"Force killing process {process.pid}")
                    process.kill()
                except Exception as e:
                    logger.error(f"Error terminating process: {e}")
        
        # Stop Redis container
        try:
            cmd = ["docker", "stop", "trading-redis"]
            process = await asyncio.create_subprocess_exec(*cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            await process.communicate()
            
            cmd = ["docker", "rm", "trading-redis"]
            process = await asyncio.create_subprocess_exec(*cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            await process.communicate()
            
            logger.info("Redis container stopped and removed")
        except Exception as e:
            logger.error(f"Error stopping Redis: {e}")
    
    async def start_system(self):
        """Start all system components"""
        logger.info("Starting MT5 Trading System...")
        
        # Start Redis first
        if not await self.start_redis():
            logger.error("Failed to start Redis, aborting")
            return False
        
        # Wait a moment for Redis to be ready
        await asyncio.sleep(2)
        
        # Start backend
        backend_process = await self.start_backend()
        if not backend_process:
            logger.error("Failed to start backend")
            await self.shutdown()
            return False
        
        self.processes.append(backend_process)
        
        # Wait for backend to be ready
        await asyncio.sleep(3)
        
        # Start frontend
        frontend_process = await self.start_frontend()
        if not frontend_process:
            logger.error("Failed to start frontend")
            await self.shutdown()
            return False
            
        self.processes.append(frontend_process)
        
        logger.info("All services started successfully!")
        logger.info("Backend: http://localhost:8000")
        logger.info("Frontend: http://localhost:3000")
        logger.info("Redis: localhost:6379")
        
        return True

async def main():
    manager = SystemManager()
    
    # Setup signal handlers for graceful shutdown
    def signal_handler():
        logger.info("Received shutdown signal")
        asyncio.create_task(manager.shutdown())
    
    # Register signal handlers
    if sys.platform != 'win32':
        loop = asyncio.get_event_loop()
        loop.add_signal_handler(signal.SIGINT, signal_handler)
        loop.add_signal_handler(signal.SIGTERM, signal_handler)
    
    try:
        # Start the system
        if await manager.start_system():
            # Monitor processes
            await manager.monitor_processes()
        
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
    finally:
        await manager.shutdown()
        logger.info("System shutdown complete")

if __name__ == "__main__":
    asyncio.run(main())
