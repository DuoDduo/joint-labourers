# JLICI Backend API (Python · FastAPI)

REST API at `/api/v1`. Owns **all** data, payments, webhooks, jobs and emails. Deployed separately from the frontend.

**Stack:** Python 3.12+ · FastAPI · SQLAlchemy 2 (async) · Alembic · Pydantic v2 · PostgreSQL 16 (SQLite for local/tests) · ARQ + Redis (jobs) · argon2 · PyJWT · pyotp · uv

## Run locally

```powershell
cd backend; Copy-Item .env.example .env; uv sync
```
```powershell
uv run alembic upgrade head; uv run python -m app.seed --demo
```
```powershell
uv run uvicorn app.main:app --reload --port 4000
```

- API docs (Swagger): http://localhost:4000/api/v1/docs
- Tests: `uv run pytest` · Lint: `uv run ruff check app tests` · Format: `uv run ruff format app tests`
- Jobs worker (needs Redis): `uv run arq app.worker.WorkerSettings`
- New migration after changing models: `uv run alembic revision --autogenerate -m "what changed"` (review the file before committing)

`--demo` loads **sample** missionaries, needs (using the retained JLICI illustrations) and prayer hours for previews. Never run it in production; the script refuses to.

## Layout

| Path | What goes there |
|------|-----------------|
| `app/main.py` | App factory: CORS, security headers, problem+json errors, routers |
| `app/core/` | `config.py` (env settings + production guards), `security.py` (argon2, JWT, refresh tokens, TOTP, AES-GCM field encryption), `errors.py` (RFC 7807) |
| `app/db/` | Declarative base, naming conventions, async engine/session |
| `app/models/` | SQLAlchemy models by domain: `identity`, `field`, `needs`, `giving`, `prayer`, `community`, `enums` |
| `app/schemas/` | Pydantic request/response models (camelCase JSON, money as strings) |
| `app/services/` | Pure domain logic: `need_states.py` (status machine), `prayer_time.py` (4 hubs, DST-safe), `money.py` |
| `app/api/v1/` | Routers: `auth`, `public` (health, regions, stats, content), `needs`, `prayer` |
| `app/api/deps.py` | DB session, current user, `require_roles()` (staff must have 2FA on) |
| `app/worker.py` | ARQ jobs: release expired reservations, expire overdue needs |
| `app/seed.py` | Reference data + optional sample data |
| `alembic/` | Migrations (`versions/`) |
| `tests/` | pytest: services (money, states, time zones) and API (auth, needs, prayer) |

## Sprint 1 endpoints

| Method | Path | Access |
|--------|------|--------|
| GET | `/health`, `/health/ready` | public |
| POST | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | public / cookie |
| GET | `/auth/me` | signed in |
| POST | `/auth/2fa/setup`, `/auth/2fa/verify` | signed in |
| GET | `/regions`, `/stats/impact`, `/content/{key}` | public |
| GET | `/needs?status=&category=&region=&almostThere=&sort=&page=`, `/needs/{code}` | public |
| POST | `/admin/needs`, `/admin/needs/{id}/transition` | field coordinator / admin / finance (2FA) |
| GET | `/prayer/hubs`, `/prayer/coverage` | public |
| POST | `/prayer/commitments` | public |

Payments, pledges, recurring gifts, email, housing and contact come in later sprints (see `docs/08-roadmap.md`).
