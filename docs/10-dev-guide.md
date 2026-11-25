# 10 · Developer Guide and Conventions

## 1. Prerequisites
Node 22 LTS + pnpm (frontend) · Python 3.12+ + uv (backend) · Docker Desktop (optional: Postgres/Redis) · Git · VS Code (extensions: Python, Ruff, Tailwind CSS IntelliSense, Markdown Mermaid).

## 2. First-time setup (after Sprint 1 initialises the apps)

```powershell
docker compose -f infra/docker/docker-compose.yml up -d
```
```powershell
cd backend; Copy-Item .env.example .env; uv sync; uv run alembic upgrade head; uv run python -m app.seed --demo; uv run uvicorn app.main:app --reload --port 4000
```
```powershell
cd frontend; Copy-Item .env.example .env.local; pnpm install; pnpm dev
```

- Frontend: http://localhost:3000 · API: http://localhost:4000/api/v1 · Swagger: http://localhost:4000/api/v1/docs · Emails: http://localhost:8025 (Mailpit)
- Payment testing: use **test keys** and the gateways' published test cards. Forward webhooks with `ngrok http 4000` (or Cloudflare Tunnel) and set the URL in the gateway test dashboards.

## 3. Git workflow
- Branches: `main` (production), `develop` (staging), `feature/<short-name>`, `fix/<short-name>`.
- Conventional commits: `feat(needs): add fund-the-remainder option`, `fix(prayer): DST shift for Sydney`.
- Every PR: description, screenshots for UI, tests, passes CI. Squash-merge into `develop`.
- Releases: PR `develop → main`, tag `vX.Y.Z`, CHANGELOG entry.

## 4. Code standards
- Frontend: TypeScript `strict`, no `any` without a comment. Backend: type hints everywhere, Ruff-clean (`uv run ruff check`), formatted (`uv run ruff format`).
- Validate every input at the boundary (Pydantic on the backend; it is the final authority). Trust nothing from the browser.
- Money: only through `lib/money` (frontend) / `app/services/money.py` (backend) (minor units, BigInt). Never `parseFloat` an amount.
- Time: only through `lib/time` (IANA zones). Never hard-code `+1`, `-5`, `EST`.
- Need status changes: only via `next_status()` in `app/services/need_states.py`.
- No personal data in logs. No secrets in code.
- Each backend service touching money or prayer schedules has unit tests. Webhooks have fixture-replay tests.

## 5. Definition of Done
1. Meets the acceptance criteria in the PRD requirement IDs (e.g. N-3, P-2).
2. Unit/integration tests added. CI green.
3. Accessible (keyboard, labels, contrast) and responsive (360 px → 1440 px).
4. Loading / empty / error states implemented.
5. API documented (Swagger decorators) and `docs/07-api-reference.md` updated if the contract changed.
6. Reviewed on staging.

## 6. Environments and deployment
| Branch | Deploys to | Notes |
|--------|-----------|-------|
| `feature/*` | Vercel preview (frontend only) | |
| `develop` | staging (FE + API) | test gateway keys, noindex, basic auth |
| `main` + tag | production | `alembic upgrade head` runs first, then API, then FE |

Rollback: redeploy the previous tag. DB migrations are backward compatible, so the old code still runs.

## 7. Operations runbook (summary)
| Situation | Action |
|-----------|--------|
| Donor says they paid but no receipt | Admin › Donations › search by email / reference. Check `payments` status. "Re-verify with gateway" button |
| Bank transfer without a reference | Reconcile › Unmatched → match manually by amount/date/name |
| Webhook failures | Sentry alert → Admin › Settings › Webhook events → replay |
| Need wrongly funded / refund | Finance: refund action (creates a negative allocation). Never edit amounts directly |
| Prayer reminders not sent | Check the ARQ worker logs and the Redis queue |
| Data deletion request | Admin › Users/Donors › "Anonymise" (keeps financial totals) |

## 8. Handover pack (delivered at launch)
- Admin handbook per role (PDF + recorded video).
- Credentials inventory in a shared password manager (Bitwarden). Ownership of all accounts (domain, Cloudflare, Vercel, Render, DB, Paystack, Flutterwave, Cloudinary, Resend, Sentry, GitHub) **in JLICI's name**, with the developer as a member.
- Architecture docs (this folder), kept up to date.
- Maintenance options for after the 30-day warranty.
