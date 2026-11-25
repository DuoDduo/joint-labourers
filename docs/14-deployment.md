# 14 · Deployment Guide (staging preview → production)

Everything here is prepared in the repo. What's missing is **accounts in JLICI's name**. Once they exist, staging is about an hour of clicking.

| Piece | Host | Config in repo |
|-------|------|----------------|
| Frontend | Vercel (root directory `frontend`) | `frontend/next.config.ts` (noindex guard) |
| Backend API | Render, Docker | `backend/Dockerfile`, `render.yaml` |
| PostgreSQL 16 | Render managed | `render.yaml` |
| Redis (jobs) | Render Key Value | `render.yaml` |
| DNS + TLS | Cloudflare | records below |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

## 1. Accounts JLICI needs to create (owner: JLICI; developer invited as member)
1. **GitHub** organisation (e.g. `jointlabourers`); the repo is pushed there.
2. **Vercel** team (Hobby is free but non-commercial; use Pro, or Cloudflare Pages).
3. **Render** workspace with a payment card (staging ≈ $7 API + $6 Postgres per month).
4. **Cloudflare** (free), with DNS for `jointlabourers.org` moved there (registrar access needed).

## 2. Staging (for the Milestone 1 board review)

**Backend (Render).** New → Blueprint → select the repo → it reads `render.yaml` and creates `jlici-api-staging`, `jlici-db-staging` and `jlici-redis-staging` from the `develop` branch. Fill the values marked "sync: false":
- `REVALIDATE_SECRET`: a long random string (also set on Vercel).
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`: the first super admin.

Migrations run on every container start (`alembic upgrade head`). Then, once, in the Render shell:

```
python -m app.seed --demo
```

**Frontend (Vercel).** Import the repo, root directory `frontend`, framework Next.js. Environment (Preview + a "staging" branch domain):

| Variable | Staging value |
|----------|---------------|
| `NEXT_PUBLIC_API_URL` | `https://api-staging.jointlabourers.org/api/v1` |
| `API_URL` | same as above |
| `NEXT_PUBLIC_SITE_URL` | `https://staging.jointlabourers.org` |
| `NEXT_PUBLIC_NOINDEX` | `true` (staging only; a production build with it fails on purpose) |
| `REVALIDATE_SECRET` | same as the backend |

**DNS (Cloudflare).**

| Name | Type | Target |
|------|------|--------|
| `staging` | CNAME | `cname.vercel-dns.com` |
| `api-staging` | CNAME | the Render service host (`jlici-api-staging.onrender.com`) |

Add both custom domains in Vercel and Render so each issues its TLS certificate. Using sub-domains of `jointlabourers.org` keeps cookies same-site; `*.vercel.app` + `*.onrender.com` would break sign-in cookies.

**Check:** `https://api-staging.jointlabourers.org/api/v1/health` → `{"status":"ok"}`, then open `https://staging.jointlabourers.org`, and claim a prayer hour to prove the round trip.

## 3. Production (Phase 5, 2 Feb 2027)
- Duplicate the blueprint with `-prod` names, `APP_ENV=production`, branch `main`, larger plans, **daily backups + point-in-time recovery** on the database.
- **Do not** run `--demo` in production (the seed script refuses anyway). Run `python -m app.seed` for reference data only.
- Vercel production env: same as staging **without** `NEXT_PUBLIC_NOINDEX`.
- DNS: apex `jointlabourers.org` + `www` → Vercel; `api` → Render. Switch the old WordPress site off only after smoke tests pass.
- Submit the sitemap to Google Search Console and Bing.

## 4. Verified locally (25 Nov 2026)
- Backend: 32 tests, Ruff lint and format clean; Alembic upgrade → check (no drift) → downgrade → upgrade, then the seed, on a clean database.
- Frontend: typecheck and production build.
- **Not yet verified:** the Docker image build (Docker Desktop wasn't running) and the migrations on a real PostgreSQL. The CI `migrations` job covers the second on the first push.
