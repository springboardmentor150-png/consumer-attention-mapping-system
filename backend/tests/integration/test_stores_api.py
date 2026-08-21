import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import UserRole
from app.api.v1.auth.service import AuthService
from app.schemas.user import UserCreate

# ---------------------------------------------------------------------------
# Token fixtures
# ---------------------------------------------------------------------------
@pytest_asyncio.fixture
async def super_admin_token(db_session: AsyncSession) -> str:
    user = await AuthService.register_user(db_session, UserCreate(
        username="superadmin",
        email="superadmin@cams.com",
        full_name="Super Admin",
        password="SuperPass123",
        role=UserRole.super_admin
    ))
    return AuthService.create_tokens(user.id).access_token


@pytest_asyncio.fixture
async def store_manager_token(db_session: AsyncSession) -> str:
    user = await AuthService.register_user(db_session, UserCreate(
        username="storemanager",
        email="manager@cams.com",
        full_name="Store Manager",
        password="ManagerPass123",
        role=UserRole.store_manager
    ))
    return AuthService.create_tokens(user.id).access_token


@pytest_asyncio.fixture
async def analyst_token(db_session: AsyncSession) -> str:
    user = await AuthService.register_user(db_session, UserCreate(
        username="analystuser",
        email="analyst@cams.com",
        full_name="Analyst User",
        password="AnalystPass123",
        role=UserRole.retail_analyst
    ))
    return AuthService.create_tokens(user.id).access_token


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
async def test_create_store_unauthenticated(async_client: AsyncClient, sample_store_data) -> None:
    """No Bearer token → 401."""
    response = await async_client.post("/api/stores", json=sample_store_data())
    assert response.status_code == 401


async def test_create_store_unauthorized_role(
    async_client: AsyncClient, analyst_token, sample_store_data
) -> None:
    """Retail analyst cannot create stores → 403."""
    headers = {"Authorization": f"Bearer {analyst_token}"}
    response = await async_client.post("/api/stores", json=sample_store_data(), headers=headers)
    assert response.status_code == 403


async def test_create_store_success(
    async_client: AsyncClient, store_manager_token, sample_store_data
) -> None:
    """Store manager can create a store; response must match API contract."""
    headers = {"Authorization": f"Bearer {store_manager_token}"}
    response = await async_client.post(
        "/api/stores", json=sample_store_data(name="Manager Store"), headers=headers
    )
    assert response.status_code == 201
    data = response.json()
    assert "layout_id" in data
    assert data["name"] == "Manager Store"
    assert isinstance(data["zones"], list)


async def test_get_all_stores(
    async_client: AsyncClient, analyst_token, store_manager_token, sample_store_data
) -> None:
    """Analyst can list stores; pagination is present."""
    mgr = {"Authorization": f"Bearer {store_manager_token}"}
    await async_client.post("/api/stores", json=sample_store_data(name="Store A"), headers=mgr)
    await async_client.post("/api/stores", json=sample_store_data(name="Store B"), headers=mgr)

    analyst = {"Authorization": f"Bearer {analyst_token}"}
    response = await async_client.get("/api/stores", headers=analyst)
    assert response.status_code == 200
    names = [s["name"] for s in response.json()]
    assert "Store A" in names
    assert "Store B" in names


async def test_get_store_by_id(
    async_client: AsyncClient, store_manager_token, sample_store_data
) -> None:
    """Get a single store by its layout_id."""
    headers = {"Authorization": f"Bearer {store_manager_token}"}
    create_resp = await async_client.post(
        "/api/stores", json=sample_store_data(name="Unique Store"), headers=headers
    )
    store_id = create_resp.json()["layout_id"]

    get_resp = await async_client.get(f"/api/stores/{store_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Unique Store"


async def test_update_store(
    async_client: AsyncClient, store_manager_token, sample_store_data
) -> None:
    """Store manager can update a store's name."""
    headers = {"Authorization": f"Bearer {store_manager_token}"}
    create_resp = await async_client.post(
        "/api/stores", json=sample_store_data(name="Old Name"), headers=headers
    )
    store_id = create_resp.json()["layout_id"]

    update_resp = await async_client.put(
        f"/api/stores/{store_id}", json={"name": "New Name"}, headers=headers
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "New Name"


async def test_delete_store_permissions(
    async_client: AsyncClient,
    store_manager_token,
    super_admin_token,
    sample_store_data
) -> None:
    """Only Super Admin can delete a store; Store Manager gets 403."""
    mgr = {"Authorization": f"Bearer {store_manager_token}"}
    admin = {"Authorization": f"Bearer {super_admin_token}"}

    create_resp = await async_client.post(
        "/api/stores", json=sample_store_data(name="Store to Delete"), headers=mgr
    )
    store_id = create_resp.json()["layout_id"]

    # Store manager cannot delete
    assert (await async_client.delete(f"/api/stores/{store_id}", headers=mgr)).status_code == 403
    # Super admin can delete
    assert (await async_client.delete(f"/api/stores/{store_id}", headers=admin)).status_code == 204
