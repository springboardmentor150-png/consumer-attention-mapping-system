import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        """Intercept and log request metadata, status code, and latency in milliseconds."""
        start_time = time.perf_counter()
        
        try:
            response = await call_next(request)
        except Exception as e:
            process_time_ms = (time.perf_counter() - start_time) * 1000
            logger.error(
                f"{request.method} {request.url.path} - FAILED with Exception: {type(e).__name__} - "
                f"Duration: {process_time_ms:.2f}ms"
            )
            raise e

        process_time_ms = (time.perf_counter() - start_time) * 1000
        
        log_message = (
            f"{request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Duration: {process_time_ms:.2f}ms"
        )
        
        # Log with appropriate severity level
        if response.status_code >= 500:
            logger.error(log_message)
        elif response.status_code >= 400:
            logger.warning(log_message)
        else:
            logger.info(log_message)

        return response
