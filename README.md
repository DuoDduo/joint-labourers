# Joint Labourers In Christ Int'l: Digital Platform

Rebuild of **jointlabourers.org**: a fast, findable ministry site with a contributory **Missionary Needs Board**, a **24/7 prayer network across four time zones** (New York · Vancouver · Lagos · Sydney), Adopt-a-Missionary partnerships, multi-currency giving and transit housing.

| Part | Path | Stack |
|------|------|-------|
| Frontend (public site, partner area, staff dashboard) | [`frontend/`](frontend/) | Next.js 15 · TypeScript · Tailwind CSS v4 |
| Backend API | [`backend/`](backend/) | Python 3.12 · FastAPI · SQLAlchemy 2 + Alembic · PostgreSQL 16 · Redis/ARQ |
| Local services | [`infra/docker/`](infra/docker/) | Postgres · Redis · Mailpit |
| Documentation | [`docs/`](docs/00-README.md) | TRD, flows, UI/UX, database, API, deployment |

Start with **[docs/00-README.md](docs/00-README.md)**.

**Status:** Sprint 1 underway (25 Nov 2026): backend foundation, design system and Milestone 1 preview pages built → target launch **2 Feb 2027**.

**Design preview:** https://duodduo.github.io/joint-labourers/ (sample data, forms switched off; rebuilt on every push to `main`).

Run locally: see [backend/README.md](backend/README.md) and [frontend/README.md](frontend/README.md).
