from datetime import timedelta
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)

def test_password_hashing() -> None:
    """Verify that password hashing matches plaintext inputs when checked via bcrypt verification."""
    password = "cams_super_secret"
    hashed = get_password_hash(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("wrong_password", hashed) is False

def test_jwt_token_creation_and_decoding() -> None:
    """Verify that generated JWT tokens contain correct subject identifiers and token types."""
    subject = "58e86866-2a58-4301-a8c3-13f162c0fabe"
    
    access_token = create_access_token(subject)
    refresh_token = create_refresh_token(subject)

    assert isinstance(access_token, str)
    assert isinstance(refresh_token, str)

    payload_access = decode_token(access_token)
    assert payload_access.get("sub") == subject
    assert payload_access.get("type") == "access"

    payload_refresh = decode_token(refresh_token)
    assert payload_refresh.get("sub") == subject
    assert payload_refresh.get("type") == "refresh"

def test_expired_token() -> None:
    """Verify that expired tokens fail validation and return empty dict payloads."""
    subject = "user-expired-token"
    expired_token = create_access_token(subject, expires_delta=timedelta(seconds=-10))
    
    payload = decode_token(expired_token)
    assert payload == {}

def test_invalid_token() -> None:
    """Verify that malformed token strings return empty dict payloads."""
    payload = decode_token("malformed.jwt.token")
    assert payload == {}
