def create_access_token(payload: dict | None = None) -> str:
    user_name = payload.get('sub', 'user') if payload else 'user'
    return f"demo-token-{user_name}"
