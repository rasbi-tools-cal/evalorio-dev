# Evalorio

Property portal for Spain, France, Italy and Portugal: owners list for free, buyers and tenants search
with filters and a map, contact owners directly and get email alerts.

**Stack:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS v4 + shadcn/ui ·
next-intl (EN/ES/FR/IT/PT) · Supabase (Postgres + PostGIS, Auth, Storage, RLS) · Leaflet ·
Cloudflare Turnstile · SMTP email (any provider).

## Run it locally

Requirements: Node 22+, pnpm, Docker Desktop.

```bash
pnpm install
pnpm db:start          # Supabase in Docker (first run downloads images)
pnpm db:reset          # applies supabase/migrations + supabase/seed.sql (demo accounts)
pnpm seed:demo         # 16 demo listings with photos (local only)
cp .env.example .env.local   # then paste the keys printed by `npx supabase status`
pnpm dev               # http://localhost:3100
```

| What | Where |
| --- | --- |
| Site | http://localhost:3100 |
| Emails (sign-up, alerts, messages) | Mailpit — http://127.0.0.1:54324 |
| Database UI | Supabase Studio — http://127.0.0.1:54323 |

Demo accounts (password `Evalorio2026`): `admin@evalorio.test` (moderator),
`owner@evalorio.test` (trusted owner, publishes instantly), `new@evalorio.test` (first listing goes to review).

## Tests

```bash
pnpm typecheck
pnpm lint
pnpm db:test     # 24 pgTAP tests: RLS, privilege escalation, listing workflow, location privacy
pnpm test:e2e    # Playwright: sign-up → post listing → moderation → search → contact → favourites
```

Trigger the alert emails by hand:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3100/api/cron/alerts?frequency=daily"
```

## How it is organised

```
app/[locale]/                      pages (English at /, other languages under /es, /fr, /it, /pt)
  [country]/[[...segments]]        SEO search pages: /spain/madrid/apartments-for-sale, /es/espana/madrid/pisos-en-venta
  listing/[ref]                    /listing/100002-penthouse-with-terrace
  post, post/[id]                  5-step listing wizard (draft autosaved per step)
  account/*, admin/*               owner dashboard, moderation
app/api/                           auth callbacks, cron, GDPR export, one-click unsubscribe
components/                        UI (shadcn in components/ui)
lib/actions/                       server actions (validated with zod, rate limited)
lib/catalog.ts                     countries, property types, localized URL slugs
messages/*.json                    translations
supabase/migrations/               schema, RLS, triggers, search functions, geography data
supabase/tests/                    database security tests
proxy.ts                           i18n routing + session refresh + protected routes
```

## Security model (short)

- Every table has RLS; nothing is granted to `anon`/`authenticated` by default, grants are explicit and
  column-level where it matters (users can never change `role`, `is_banned`, `is_trusted`).
- Owners cannot publish directly: a trigger enforces the status workflow. The first listing of a new
  owner goes to moderation; approved owners become trusted.
- Exact address, exact coordinates and phone number live in `listing_private` (owner/admin only).
  The public pin is offset by 80–200 m unless the owner opts in. Phone numbers are revealed on click,
  rate limited and logged.
- Captcha (Turnstile) on sign-up, login, password reset, messages and reports; Postgres-backed rate
  limits; honeypot on the contact form; contact details and links are refused in listing text.
- Photos are resized and re-encoded in the browser (EXIF/GPS removed), uploaded only into the
  owner's own folder, max 20 per listing, 10 MB, JPEG/PNG/WebP.
- Strict security headers (CSP, HSTS in production, frame-ancestors none).

## Going to production

1. Create a Supabase project (EU region) and push the schema — step by step in
   [docs/supabase-hosted.md](docs/supabase-hosted.md) (`pnpm remote:link`, `remote:push`, `remote:config`, `remote:check`).
2. In the Supabase dashboard: Auth → URL configuration (site URL + `https://yourdomain/**`),
   Email templates (copy `supabase/templates/*`), Captcha → Turnstile secret, custom SMTP,
   Google provider (optional; then set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`).
3. Make yourself admin: `pnpm remote:make-admin you@example.com`.
4. Set the variables from `.env.example` in Vercel (production keys, never the local ones).
5. Map tiles: OpenStreetMap's tile servers are not for production traffic — set
   `NEXT_PUBLIC_MAP_TILE_URL` / `_ATTRIBUTION` / `_ORIGINS` to a provider (MapTiler, Stadia, …).
6. Crons are declared in `vercel.json` (`instant` every 15 min needs a paid Vercel plan).
7. Have the legal pages (`lib/static-content.tsx`) reviewed and completed; fill in the [brackets].
