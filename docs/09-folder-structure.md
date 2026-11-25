# 09 · Folder Structure

One repository with **two separate apps**: a Next.js frontend (TypeScript) and a FastAPI backend (Python). Each has its own dependencies, environment file, tests and deployment. They talk only over HTTPS JSON. The frontend's API types are generated from the backend's OpenAPI schema.

```
joint-labourers/
├── README.md                     ← start here
├── .gitignore  .editorconfig
├── .claude/launch.json           local preview: "api" (port 4000) and "web" (port 3000)
│
├── docs/                         ← planning & documentation
│   ├── 00-README.md              index
│   ├── 01-PRD.md  02-TRD.md  03-technical-flow.md  04-app-flow.md
│   ├── 05-ui-ux-brief.md  06-database.md  07-api-reference.md
│   ├── 08-roadmap.md  09-folder-structure.md  10-dev-guide.md
│   └── 11-open-questions.md  12-decision-log.md  13-sprint-1-report.md
│
├── frontend/                     ← Next.js 15 · React 19 · Tailwind v4 (deploys to Vercel)
│   ├── package.json  tsconfig.json  next.config.ts  postcss.config.mjs  .env.example
│   ├── public/
│   │   ├── brand/                logos from the old site (PNG + SVG, scanned clean)
│   │   └── images/illustrations/ ✅ JLICI's 18-panel illustrated scripture series (retained)
│   └── src/
│       ├── app/
│       │   ├── layout.tsx        fonts, metadata, noindex switch
│       │   ├── not-found.tsx
│       │   ├── (public)/         layout (header/footer), page.tsx (Home), needs/, needs/[code]/,
│       │   │                     pray/, give/, gallery/, error.tsx
│       │   │                     later: about/, missionaries/, transit-housing/, contact/, legal
│       │   ├── (auth)/           login/, register/  (Sprint 2)
│       │   ├── account/          partner area       (Phase 4)
│       │   ├── admin/            staff dashboard    (Phase 2–3)
│       │   └── api/revalidate/   ISR hook called by the backend (Phase 2)
│       ├── components/
│       │   ├── ui/               Button, ProgressBar, Badge
│       │   ├── layout/           Header, Footer
│       │   ├── needs/            NeedCard, GivePanel
│       │   ├── prayer/           PrayerClock, PrayerGrid (+ claim dialog)
│       │   ├── give/             GiveForm (3-step)
│       │   └── illustrations/    ScriptureCard
│       ├── config/               site.ts (nav, contact), illustrations.ts (captions + alt text)
│       ├── lib/
│       │   ├── api/              client.ts (fetch + problem+json), types.ts (→ generated schema.d.ts)
│       │   ├── money/            minor-unit formatting
│       │   └── time/             prayer-hub clock, relay, UTC ↔ local grid
│       └── styles/globals.css    design tokens (brand palette, type, radius, shadow)
│
├── backend/                      ← Python 3.12 · FastAPI · SQLAlchemy 2 · Alembic (deploys to Render/Railway/VPS)
│   ├── pyproject.toml  uv.lock  alembic.ini  .env.example  README.md
│   ├── alembic/
│   │   ├── env.py                async; URL from app settings
│   │   └── versions/             ✅ 20261125_…_initial_schema.py (38 tables)
│   ├── app/
│   │   ├── main.py               app factory: CORS, security headers, errors, routers
│   │   ├── core/                 config.py · security.py (argon2, JWT, TOTP, AES-GCM) · errors.py (RFC 7807)
│   │   ├── db/                   base.py (naming, mixins) · session.py (async engine)
│   │   ├── models/               enums · identity · field · needs · giving · prayer · community
│   │   ├── schemas/              Pydantic: common (camelCase, money as string) · auth · public
│   │   ├── services/             need_states.py · prayer_time.py · money.py   (pure, unit-tested)
│   │   ├── api/
│   │   │   ├── deps.py           session, current user, require_roles() (+ staff 2FA)
│   │   │   ├── router.py
│   │   │   └── v1/               auth.py · public.py · needs.py · prayer.py
│   │   │                         later: payments.py · webhooks.py · pledges.py · housing.py · contact.py · admin/*
│   │   ├── worker.py             ARQ jobs (reservations, overdue needs; later email, reminders)
│   │   └── seed.py               reference data (+ --demo sample data)
│   └── tests/                    conftest.py · test_services.py · test_api.py
│
├── infra/docker/docker-compose.yml   optional local Postgres 16 + Redis 7 + Mailpit
├── .github/workflows/                CI (Sprint 2): backend pytest + ruff; frontend typecheck + build
└── business/                         proposals, invoices, briefs (suggest moving the JLICI_* files here)
```

## Backend module pattern

New features follow the same four layers:

```
app/models/<domain>.py        tables
app/schemas/<domain>.py       request/response shapes (camelCase JSON)
app/services/<domain>.py      business rules: pure functions where possible, unit-tested
app/api/v1/<domain>.py        thin router: validate → call service → commit → respond
tests/test_<domain>.py        service tests + API tests
```

## Naming rules

| Thing | Convention | Example |
|-------|-----------|---------|
| Frontend files | kebab-case routes, PascalCase components | `needs/[code]/page.tsx`, `PrayerGrid.tsx` |
| Python modules | snake_case | `need_states.py` |
| DB tables / columns | snake_case plural / snake_case | `prayer_commitments.local_hour` |
| JSON fields | camelCase | `localHour`, `targetMinor` |
| Enums | SCREAMING_SNAKE | `PARTIALLY_FUNDED` |
| Env vars | SCREAMING_SNAKE; `NEXT_PUBLIC_` only for browser-safe values | `JWT_SECRET`, `NEXT_PUBLIC_API_URL` |
