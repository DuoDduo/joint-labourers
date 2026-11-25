"""Typed application settings, read from environment variables / .env."""

from functools import lru_cache

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEV_SECRET = "dev-only-change-me"  # noqa: S105


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"  # development | test | staging | production
    api_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:3000"
    cors_origins: list[str] = ["http://localhost:3000"]

    # SQLite is fine for local work without Docker; staging/production MUST use
    # postgresql+asyncpg://user:pass@host:5432/db
    database_url: str = "sqlite+aiosqlite:///./jlici-dev.db"
    redis_url: str = "redis://localhost:6379"

    jwt_secret: str = _DEV_SECRET
    access_token_minutes: int = 15
    refresh_token_days: int = 30
    cookie_domain: str | None = None
    cookie_secure: bool = False

    field_encryption_key: str = _DEV_SECRET
    revalidate_secret: str = _DEV_SECRET

    seed_admin_email: str | None = None
    seed_admin_password: str | None = None

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @model_validator(mode="after")
    def _guard_production(self) -> "Settings":
        if self.app_env in {"staging", "production"}:
            weak = [
                name
                for name in ("jwt_secret", "field_encryption_key", "revalidate_secret")
                if getattr(self, name) == _DEV_SECRET
            ]
            if weak:
                raise ValueError(f"Set real values for: {', '.join(weak)}")
            if not self.database_url.startswith("postgresql"):
                raise ValueError("staging/production require PostgreSQL")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
