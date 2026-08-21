from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.security import decode_token

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        """Extract and validate JWT Bearer token from Authorization header if present."""
        auth_header = request.headers.get("Authorization")
        if auth_header:
            if not auth_header.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid authentication scheme. Only 'Bearer' is supported."}
                )
            
            token = auth_header.split(" ")[1]
            payload = decode_token(token)
            if not payload:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Signature verification failed or token has expired."}
                )
            
            # Attach parsed payload to request state for downstream dependencies
            request.state.token_payload = payload
        else:
            request.state.token_payload = None

        return await call_next(request)
