# Connecting a new hosted Supabase project

Everything in the database (tables, RLS, functions, storage bucket, cron job, 5 621 cities) is created
by `supabase/migrations`. Demo accounts and demo listings are **never** pushed (`seed.sql` and
`scripts/seed-demo.mjs` are local-only; the demo script refuses non-local URLs).

## 1. Create the project (dashboard)

- https://supabase.com/dashboard → New project, name `evalorio`, region **Central EU (Frankfurt)**
  or **West EU (Paris)** (GDPR, closest to ES/FR/IT/PT).
- Generate a strong database password and store it in your password manager.

## 2. Link and push the schema (CLI)

```bash
npx supabase login                                  # opens the browser
pnpm remote:link --project-ref <project-ref>        # asks for the database password
pnpm remote:push                                    # applies all migrations
```

## 3. Auth settings

Push the settings from `supabase/config.toml` (password rules, email confirmation, captcha,
email templates, redirect URLs). Set the URLs for this project first (PowerShell shown):

```powershell
$env:SITE_URL = "http://localhost:3100"            # later: https://www.evalorio.com
$env:AUTH_REDIRECT_URL = "http://localhost:3100/**" # later: https://www.evalorio.com/**
$env:TURNSTILE_SECRET_KEY = "<real Turnstile secret>"
npx supabase config diff                            # review
pnpm remote:config                                  # confirm each change
```

Then in the dashboard:

- **Authentication → SMTP**: configure a provider (Resend, Postmark, Brevo, SES…). Without it Supabase
  only emails members of your organisation, so real users could not confirm their account.
- **Authentication → Providers → Google** (optional): client ID/secret, then
  `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` in the app.

## 4. Keys for the app

Dashboard → Project Settings → API Keys. Copy `.env.remote.example` to `.env.remote.local` and fill in
URL, publishable key and secret key.

```bash
pnpm remote:check                      # schema, RLS, bucket, admin
```

## 5. First admin

Sign up on the site with your own email (confirm it), then:

```bash
pnpm remote:make-admin you@example.com
```

## 6. Run the app against the hosted project

Either put the three Supabase values into `.env.local` (keep a copy of the local ones), or set them
as environment variables in Vercel for deployment together with the rest of `.env.example`.
Nothing else to change: `next.config.mjs` derives the image domain and the Content-Security-Policy
from `NEXT_PUBLIC_SUPABASE_URL`.
