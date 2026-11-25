# JLICI Frontend (Next.js 15 · TypeScript · Tailwind v4)

Public website, and later the partner area (`/account`) and staff dashboard (`/admin`). Talks to the FastAPI backend **only** over HTTP (`NEXT_PUBLIC_API_URL`). There is no database access from here.

## Run locally

The backend must be running on port 4000 (see `../backend/README.md`).

```powershell
cd frontend; Copy-Item .env.example .env.local; pnpm install; pnpm dev
```

Open http://localhost:3000. Other commands: `pnpm typecheck` · `pnpm build` · `pnpm api:types` (regenerate API types from the running backend's OpenAPI schema).

## Pages in the Milestone 1 preview

| Route | What it shows |
|-------|---------------|
| `/` | Hero (Luke 8:3 illustration), live impact stats, prayer relay strip, needs almost there, four pathways, illustrated series |
| `/needs` | Needs board with filters (open / met / almost there, category, region) |
| `/needs/[code]` | Need detail, progress, contributory give panel (presets, 25%, 50%, fund the remainder), sticky mobile bar |
| `/pray` | Live 4-hub prayer clock, 168-hour coverage grid in your time zone, **working** "claim this hour" |
| `/give` | 3-step give form (amount, details, method). **Design preview: no payment is taken** until Phase 4 |
| `/gallery` | All 18 retained JLICI illustrated scripture panels, grouped by theme |

## Folders

| Folder | What goes there |
|--------|-----------------|
| `src/app/(public)` | Public pages (shared header/footer layout) |
| `src/components/ui` | Design-system primitives (Button, ProgressBar, Badge) |
| `src/components/{needs,prayer,give,illustrations,layout}` | Feature components |
| `src/config/illustrations.ts` | The retained illustration series: file, scripture reference, alt text, theme |
| `src/lib/api` | API client (problem+json errors) and response types |
| `src/lib/money` | Minor-unit formatting (`Intl.NumberFormat`) |
| `src/lib/time` | Prayer-hub clock, relay and UTC ↔ local grid (IANA zones, DST-safe) |
| `src/styles/globals.css` | Design tokens from the logo deck (contrast-safe variants) |
| `public/images/illustrations` | JLICI's scripture panels, kept from the old site |
| `public/brand` | Logos from the old site |
