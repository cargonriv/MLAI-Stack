"""
Production-optimized FastAPI server configuration
"""
import os
import logging
import multiprocessing
from typing import Optional

import uvicorn
from main import app

# Configure logging for production
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/app.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def get_workers() -> int:
    """Calculate optimal number of workers based on CPU cores"""
    workers = int(os.getenv('WORKERS', '0'))
    if workers <= 0:
        # Use (2 * CPU cores) + 1 for optimal performance
        workers = (2 * multiprocessing.cpu_count()) + 1
        # Cap at 8 workers to prevent resource exhaustion
        workers = min(workers, 8)
    return workers

def get_host() -> str:
    """Get host configuration"""
    return os.getenv('HOST', '0.0.0.0')

def get_port() -> int:
    """Get port configuration"""
    return int(os.getenv('PORT', '8000'))

def get_log_level() -> str:
    """Get log level configuration"""
    return os.getenv('LOG_LEVEL', 'INFO').upper()

def run_production_server():
    """Run the production server with optimized settings"""
    host = get_host()
    port = get_port()
    workers = get_workers()
    log_level = get_log_level()
    
    logger.info(f"Starting production server on {host}:{port}")
    logger.info(f"Workers: {workers}")
    logger.info(f"Log level: {log_level}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        log_level=log_level.lower(),
        access_log=True,
        use_colors=False,
        server_header=False,
        date_header=False,
        # Production optimizations
        loop="uvloop",  # Use uvloop for better performance
        http="httptools",  # Use httptools for better HTTP parsing
        # SSL configuration (if certificates are provided)
        ssl_keyfile=os.getenv('SSL_KEYFILE'),
        ssl_certfile=os.getenv('SSL_CERTFILE'),
        # Timeout configurations
        timeout_keep_alive=5,
        timeout_graceful_shutdown=30,
    )

if __name__ == "__main__":
    run_production_server()