"""Test setup: a throwaway SQLite database, schema from the models, seeded sample data."""

import os
import tempfile
from collections.abc import AsyncIterator

_DB = os.path.join(tempfile.mkdtemp(prefix="jlici-test-"), "test.db")
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_DB}"
os.environ["APP_ENV"] = "test"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-hs256-signing"
os.environ.pop("SEED_ADMIN_EMAIL", None)

import pyotp  # noqa: E402
import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.core.security import encrypt_field, hash_password  # noqa: E402
from app.db.session import SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models import Base, User  # noqa: E402
from app.seed import seed_base, seed_demo  # noqa: E402

STAFF_PASSWORD = "correct-horse-battery"
TOTP_SECRET = pyotp.random_base32()


@pytest.fixture(scope="session", autouse=True)
async def database() -> AsyncIterator[None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as session:
        await seed_base(session)
        await seed_demo(session)
    yield
    await engine.dispose()


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test/api/v1") as c:
        yield c


async def make_user(email: str, roles: list[str], totp: bool = True) -> User:
    async with SessionLocal() as session:
        user = User(
            email=email,
            first_name="Test",
            password_hash=hash_password(STAFF_PASSWORD),
            roles=roles,
            totp_enabled=totp,
            totp_secret_enc=encrypt_field(TOTP_SECRET) if totp else None,
        )
        session.add(user)
        await session.commit()
        return user


async def login(client: AsyncClient, email: str, totp: bool = True) -> None:
    body = {"email": email, "password": STAFF_PASSWORD}
    if totp:
        body["totp"] = pyotp.TOTP(TOTP_SECRET).now()
    r = await client.post("/auth/login", json=body)
    assert r.status_code == 200, r.text
