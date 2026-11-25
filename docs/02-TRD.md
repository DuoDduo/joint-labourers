# 02 · Technical Requirements Document (TRD)

**Product:** JLICI Digital Platform · **Version:** 1.0 · **Date:** 24 Nov 2026

---

## 1. Architecture overview

The frontend and backend are **two separate applications** in one repository (monorepo), deployed independently and talking only over HTTPS JSON.

```
                 ┌──────────────────────────── Browser / Mobile ────────────────────────────┐
                 │   Public site · Partner area · Staff dashboard  (one Next.js app)        │
                 └───────────────┬──────────────────────────────────────────┬──────────────┘
                                 │ HTTPS (REST / JSON, cookies)              │ redirect
                                 ▼                                           ▼
 ┌──────────────── frontend/ ───────────────┐                  ┌──── Payment gateways ────┐
 │ Next.js 15 (App Router, RSC, ISR)        │                  │ Paystack  (NGN)          │
 │ TypeScript · Tailwind CSS v4             │                  │ Flutterwave (USD GBP EUR │
 │ Host: Vercel (or Cloudflare Pages)       │                  │   CAD AUD KES)           │
 └───────────────┬──────────────────────────┘                  └───────────┬──────────────┘
                 │ fetch  /api/v1/*                                         │ webhooks
                 ▼                                                          ▼
 ┌──────────────── backend/ ────────────────────────────────────────────────────────────────┐
 │ FastAPI (Python 3.12, async)  ·  REST API /api/v1  ·  OpenAPI (Swagger at /api/v1/docs)    │
 │ Modules: auth · users · missionaries · needs · donations · payments · pledges · recurring│
 │          prayer · housing · contact · content · media · notifications · reports · audit  │
 │ SQLAlchemy 2 + Alembic ──► PostgreSQL 16  (SQLite for local dev and tests)                 │
 │ ARQ         ──► Redis 7   (jobs: emails, prayer reminders, pledge expiry, need deadlines)  │
 │ Host: Render / Railway, or a VPS (Docker) in the EU-West region                            │
 └──────┬──────────────┬───────────────┬──────────────────┬─────────────────────────────────┘
        ▼              ▼               ▼                  ▼
   Cloudinary /    Resend / Brevo   Termii / Twilio     Sentry · Better Stack
   Cloudflare R2   (email)          (SMS / WhatsApp,    (errors · uptime · logs)
   (media)                           Phase 2)
```

### Why this stack

| Choice | Reason |
|--------|--------|
| **Next.js + Tailwind (frontend)** | Matches the approved proposal (TypeScript + Tailwind). Server rendering and ISR give sub-second pages and good SEO. One codebase serves the public site, partner area and admin |
| **FastAPI (backend, Python)** | Client's chosen stack (decision 25 Nov 2026). Async, fast, automatic OpenAPI docs, Pydantic validation, dependency-injected role guards. Large Python talent pool |
| **PostgreSQL + SQLAlchemy 2 + Alembic** | Money and status flows need ACID transactions and row locks (no over-funding). SQLAlchemy gives typed models and `SELECT … FOR UPDATE`; Alembic gives reviewed, versioned migrations |
| **Redis + ARQ** | Async Python job queue with cron: prayer reminders across 4 time zones, pledge expiry, deadline checks, email retries |
| **Paystack + Flutterwave** | Paystack: best for Nigerian cards, USSD, bank transfer and NGN subscriptions. Flutterwave: international currencies, KES M-Pesa, CAD/AUD. Stripe cannot onboard a Nigerian entity directly |

## 2. Environments

| Env | Frontend | Backend | DB | Payments |
|-----|----------|---------|----|----------|
| `local` | `localhost:3000` | `localhost:4000` | SQLite (or Docker Postgres) + Redis | Gateway **test** keys |
| `staging` | `staging.jointlabourers.org` | `api-staging.jointlabourers.org` | Managed Postgres (small) | Test keys |
| `production` | `jointlabourers.org` | `api.jointlabourers.org` | Managed Postgres + daily backups + PITR | Live keys |

Staging is protected with HTTP basic auth plus `noindex` (**and that header must be removed in production**; the CI check in §11 stops it reaching production).

## 3. Frontend requirements

- **Framework:** Next.js 15 App Router, React 19, TypeScript `strict`.
- **Styling:** Tailwind CSS v4 with design tokens from the brand palette (see UI/UX brief). Components: own library + Radix UI primitives (accessible dialogs, tabs, selects).
- **Data:** Server Components fetch public data with `revalidate` (ISR 60 s for needs and progress; on-demand revalidation through a webhook from the backend when a need changes). Client mutations use TanStack Query.
- **Forms:** small client components; the backend's Pydantic rules are the final authority. **API types are generated** from FastAPI's OpenAPI schema (`pnpm api:types`, openapi-typescript), so the two apps cannot drift.
- **Auth:** httpOnly, Secure, SameSite=Lax cookies set by the API (shared parent domain `.jointlabourers.org`). Middleware protects `/account/*` and `/admin/*`.
- **Time zones:** `Intl.DateTimeFormat` + `@date-fns/tz` for the prayer clock and grid. Never hard-code offsets.
- **Images:** `next/image` with Cloudinary loader (AVIF/WebP, responsive `sizes`).
- **Analytics:** privacy-friendly (Plausible or Umami), no cookies → no cookie banner needed (as on the Angel Tree).
- **PWA (light):** manifest + icons. Offline page.

## 4. Backend requirements

- **Runtime:** Python 3.12+, FastAPI, Uvicorn, managed with `uv`. Ruff for lint/format, mypy for types.
- **API style:** REST, versioned at `/api/v1`, JSON, errors in RFC 7807 problem+json format. OpenAPI at `/api/docs` (staging only).
- **Validation:** Pydantic v2 models (camelCase JSON, money as strings). Invalid input returns 422 problem+json.
- **ORM:** SQLAlchemy 2 async (asyncpg in production, aiosqlite locally). Alembic migrations kept in git; autogenerated files are always reviewed.
- **Jobs (ARQ):** `release_expired_reservations`, `expire_overdue_needs` (built in Sprint 1); later `email`, `prayer_reminders`, `pledge_expiry`, `recurring_sync`, `dst_rebalance`.
- **Rate limiting:** `slowapi` with a Redis store. Stricter limits on auth, forms, "I prayed" and payment init.
- **Bot protection:** Cloudflare Turnstile on public forms (invisible, privacy-friendly).
- **Logging:** structured JSON logs (structlog) with a request ID. No personal data or secrets in logs.

## 5. Money handling rules (critical)

1. **Store amounts as integers in minor units** (kobo, cents, pence) as `BigInt`. Never floats.
2. Every money row stores its `currency` (ISO 4217).
3. **Needs have one target currency** (normally NGN). Gifts in other currencies are converted at confirmation: `amount_in_need_currency = round(amount × fx_rate)`. Store `fx_rate`, `fx_source` and `fx_at` on the allocation for audit.
4. FX source: the gateway's settlement rate when it is in the webhook, otherwise a daily rate from an FX API (e.g. Open Exchange Rates) cached in `fx_rates`.
5. **Payments are confirmed only by verified webhooks** (HMAC signature check) **plus** a server-side verify call to the gateway. The browser redirect only shows a "processing" page.
6. **Idempotency:** a unique `(provider, provider_reference)` on `payments`, and a processed-events table for webhooks. Retried webhooks are a no-op.
7. **No over-funding (contributory needs):**
   - `available = target − confirmed − active_reservations`.
   - Starting a card checkout creates a **reservation** (TTL 30 min); a bank-transfer pledge reserves for **7 days**.
   - At confirmation, inside a transaction, `SELECT … FOR UPDATE` on the need row. Allocate `min(gift, remaining)` to the need and put any surplus to the General Fund (`donation_allocations` has two rows). If the need now equals its target → status `funded`.
8. Refunds and reversals create **negative ledger entries**. Nothing is ever deleted.

## 6. Need status machine

```
          submit            approve             first gift          target met
 draft ─────────► in_review ─────────► open ───────────► partially_funded ─────────► funded
   ▲                │ reject                │  ▲                      │                     │ finance pays out
   └────────────────┘                       │  └──── extend ──────┐   │                     ▼
                                            │                     │   ▼                 disbursed
                                pause/resume│                deadline passed                │ update posted
                                            ▼                      ▼                         ▼
                                          paused               expired ──► (close_partial → funded → disbursed)  fulfilled
                                                                  └──► (reallocate → closed, funds → General Fund)
 any pre-funded state ── cancel (admin, with reason) ──► cancelled  (funds reallocated, contributors notified)
```

Changes happen only through `next_status()` in `backend/app/services/need_states.py` (used by the admin transition endpoint, payment confirmation and jobs). Every change writes `need_status_history` and an audit-log row.

## 7. Authentication and authorisation

| Actor | Method |
|-------|--------|
| Donor / intercessor (guest) | No account. A **magic link** (signed, single-use, 30 min) emailed to manage recurring gifts or prayer slots |
| Partner account | Email + password (argon2id) **or** magic link. Optional Google sign-in |
| Staff | Email + password + **TOTP 2FA required**. Session idle timeout 60 min (as on the Angel Tree team pages) |

Tokens: short access JWT (15 min) + rotating refresh token (30 days, hashed in DB), both httpOnly cookies. CSRF: SameSite=Lax + double-submit token on state-changing requests.

**Roles (RBAC):** `super_admin`, `admin`, `finance`, `field_coordinator`, `prayer_coordinator`, `housing_coordinator`, `content_editor`, `missionary` (Phase 2), `partner`.

| Permission | super | admin | finance | field | prayer | housing | content |
|------------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Needs: create/edit | ✓ | ✓ | | ✓ | | | |
| Needs: approve/publish | ✓ | ✓ | | | | | |
| Needs: mark disbursed | ✓ | ✓ | ✓ | | | | |
| Donations / pledges / reconcile | ✓ | ✓ | ✓ | | | | |
| Missionaries (incl. sensitive data) | ✓ | ✓ | | ✓ | | | |
| Prayer moderation / slots | ✓ | ✓ | | | ✓ | | |
| Housing requests / hosts | ✓ | ✓ | | | | ✓ | |
| Pages, gallery, reports | ✓ | ✓ | | | | | ✓ |
| Users & roles, settings | ✓ | | | | | | |

## 8. Security and privacy

- TLS everywhere, HSTS. CSP with nonces. `X-Frame-Options: DENY` (except gateway iframes if used).
- Secrets in the host's secret manager. Never in git. `.env.example` only.
- **Field-level encryption** (AES-256-GCM, key in env/KMS) for: missionary legal name, exact location, phone; host family addresses; housing requester details. The public API only returns aliases and regions.
- Uploaded images: EXIF/GPS metadata **stripped** before storage (protects missionaries in sensitive areas).
- Audit log for every staff action (who, what, before/after, IP).
- Data retention: contact messages 2 years, unpaid pledges 1 year, donations 7 years (financial records).
- Data subject requests (NDPA 2023 / GDPR): export and erase (donations anonymised, not deleted).

## 9. Notifications

| Event | Channel | To |
|-------|---------|----|
| Gift confirmed | Email receipt (+PDF) | Donor |
| Pledge created | Email with bank details + reference | Donor |
| Pledge expiring (day 5) | Email reminder | Donor |
| Need funded | Email | Contributors, field coordinator |
| Need fulfilled (update posted) | Email (+ WhatsApp Phase 2) | Contributors |
| Need expired / cancelled | Email with outcome | Contributors |
| Prayer slot reminder | Email 30 min before, local time | Intercessor |
| New prayer request / housing / contact | Email | Matching coordinator |
| Recurring payment failed | Email with card-update link | Partner |

Email provider: Resend (or Brevo). Templates: React Email, branded, plain-text fallback.

## 10. Performance budgets

| Item | Budget |
|------|--------|
| LCP (mobile, 4G) | < 2.0 s |
| CLS | < 0.05 |
| INP | < 200 ms |
| JS on Home (gz) | < 120 KB |
| API p95 (read) | < 200 ms |
| API p95 (payment init) | < 800 ms |

## 11. Quality, testing and CI/CD

- **Unit:** Vitest (frontend), pytest (backend). ≥ 80% on `needs`, `donations`, `payments`, `prayer` services.
- **Integration:** pytest + httpx against the FastAPI app (SQLite locally, a PostgreSQL service in CI). Webhook replay fixtures for Paystack and Flutterwave.
- **E2E:** Playwright: give once, fund a need (partial + "fund the remainder" race), pledge → reconcile, claim a prayer hour in each of the 4 hubs, housing request.
- **Accessibility:** axe in Playwright, Lighthouse CI.
- **CI (GitHub Actions):** lint → typecheck → test → build → Lighthouse (frontend) / migrations check (backend) → deploy to staging on `develop`, to production on a tagged release from `main`. **Guard:** a production build fails if `noindex` is found in the output.

## 12. Hosting and estimated running costs (monthly)

| Service | Plan | Est. USD |
|---------|------|---------|
| Vercel (frontend) | Pro (or Cloudflare Pages: free) | 0–20 |
| Backend (Render/Railway) | 1 small instance | 7–15 |
| PostgreSQL (Neon / Render) | Small with backups | 0–19 |
| Redis (Upstash) | Free tier / pay-as-you-go | 0–5 |
| Cloudinary | Free tier | 0 |
| Resend email | Free 3k/month, then $20 | 0–20 |
| Sentry + Better Stack | Free tiers | 0 |
| **Total** | | **≈ $10–80** |

Domain stays `jointlabourers.org`. DNS moves to Cloudflare (free) for TLS, caching and Turnstile.
