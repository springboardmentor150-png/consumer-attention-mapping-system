import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.db.postgres import Base, get_db
from app.main import app

# ---------------------------------------------------------------------------
# Test database — file-based SQLite so no PostgreSQL credentials are required
# ---------------------------------------------------------------------------
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test_cams.db"

engine = create_async_engine(
    TEST_DATABASE_URL,
    future=True,
    echo=False,
    connect_args={"check_same_thread": False}
)

TestingSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

# ---------------------------------------------------------------------------
# Session-scoped: create tables once, drop DB file on teardown
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture(scope="session", autouse=True)
async def initialize_tables() -> AsyncGenerator[None, None]:
    """Create all tables before the test session; clean up afterwards."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    import os
    if os.path.exists("./test_cams.db"):
        try:
            os.remove("./test_cams.db")
        except OSError:
            pass

# ---------------------------------------------------------------------------
# Function-scoped: isolated DB session per test (rolled back on teardown)
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a transactional DB session that is rolled back after each test."""
    connection = await engine.connect()
    transaction = await connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    await session.close()
    await transaction.rollback()
    await connection.close()

# ---------------------------------------------------------------------------
# Function-scoped: HTTPX async client with DB dependency overridden
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def async_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Yield an AsyncClient that talks to the FastAPI app using the test DB."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client

    app.dependency_overrides.clear()

# ---------------------------------------------------------------------------
# Data factories
# ---------------------------------------------------------------------------
@pytest.fixture
def sample_user_data():
    def _factory(
        username="testuser",
        email="testuser@cams.com",
        role="retail_analyst",
        password="testpassword"
    ):
        return {
            "username": username,
            "email": email,
            "full_name": "Test User",
            "password": password,
            "role": role
        }
    return _factory

@pytest.fixture
def sample_store_data():
    def _factory(name="Test Retail Store", city="New York"):
        return {
            "name": name,
            "location": "North Wing",
            "address": "123 Retail Ave",
            "city": city,
            "country": "USA",
            "store_type": "Supermarket",
            "total_area_sqft": 15000.0,
            "is_active": True,
            "metadata": {"brand_focus": "Premium"}
        }
    return _factory
