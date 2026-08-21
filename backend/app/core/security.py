from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def hash_password(password: str):
    # Debug prints removed: they wrote the plaintext password, its type and its
    # length to stdout on every registration, leaking credentials into server
    # logs. Hashing behaviour is unchanged.
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(
        plain_password,
        hashed_password
    )