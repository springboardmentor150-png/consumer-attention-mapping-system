from fastapi import FastAPI, Request, Response
import os
import httpx

app = FastAPI(
    title="Consumer Attention Mapping API Gateway",
    version="1.0.0",
)

BACKEND_URL = os.getenv("BACKEND_URL", "http://127.0.0.1:8000")


@app.get("/")
def root():
    return {
        "message": "Consumer Attention Mapping API Gateway",
        "status": "running",
    }


@app.api_route(
    "/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)
async def gateway(path: str, request: Request):

    target_url = f"{BACKEND_URL}/{path}"

    # Forward important headers, especially JWT Authorization
    headers = dict(request.headers)

    # Host belongs to the gateway, not the backend
    headers.pop("host", None)

    body = await request.body()

    async with httpx.AsyncClient() as client:

        response = await client.request(
            method=request.method,
            url=target_url,
            headers=headers,
            content=body,
            params=request.query_params,
        )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers={
            key: value
            for key, value in response.headers.items()
            if key.lower()
            not in {
                "content-encoding",
                "transfer-encoding",
                "connection",
            }
        },
        media_type=response.headers.get("content-type"),
    )
