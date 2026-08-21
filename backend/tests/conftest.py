import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test database URL (SQLite in-memory or test PostgreSQL)
os.environ["DATABASE_URL"] = "sqlite:///./test_cams.db"
os.environ["SECRET_KEY"] = "test-secret-key-for-jwt-tokens-1234567890"

from app.database import Base, get_db
from app.main import app
from app.auth import hash_password, create_access_token
from app.models import User, Store

engine = create_engine("sqlite:///./test_cams.db", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    try:
        if os.path.exists("./test_cams.db"):
            os.remove("./test_cams.db")
    except Exception:
        pass


@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    import uuid as _uuid
    user = User(
        id=_uuid.uuid4(),
        name="Admin Test",
        email="admin@test.com",
        password_hash=hash_password("admin123"),
        role="Admin",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_headers(admin_user):
    token = create_access_token({"sub": str(admin_user.id), "role": admin_user.role})
    return {"Authorization": f"Bearer {token}"}
