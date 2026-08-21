import sys
from pathlib import Path
from loguru import logger
from app.core.config import settings

def setup_logging() -> None:
    """Configure loguru to output to console and daily rotating file."""
    # Remove standard loguru handler
    logger.remove()

    # Determine logging level based on debug setting
    log_level = "DEBUG" if settings.DEBUG else "INFO"

    # Add console handler with custom formatting
    logger.add(
        sys.stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        enqueue=True
    )

    # Ensure log directory exists
    log_dir = Path("logs")
    log_dir.mkdir(exist_ok=True)

    # Add file handler with daily rotation and retention
    logger.add(
        log_dir / "cams.log",
        rotation="00:00",  # daily rotation at midnight
        retention="30 days",
        level="INFO",
        format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} - {message}",
        enqueue=True,
        encoding="utf-8"
    )

# Automatically configure on import
setup_logging()
