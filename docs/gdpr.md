# GDPR and ePrivacy: how Evalorio complies

Internal document (accountability, Art. 5(2) and 30 GDPR). Keep it in sync with the code and with
`content/legal/<locale>/*.md`. The public texts must never promise something this file doesn't describe.

## Before launch

- [ ] Fill in the legal identity env vars (`NEXT_PUBLIC_COMPANY_*`, `NEXT_PUBLIC_LEAD_AUTHORITY`,
      `NEXT_PUBLIC_DATA_REGION`, `NEXT_PUBLIC_EMAIL_PROVIDER`, `NEXT_PUBLIC_EMAIL_REGION`). Until then the legal
      pages show `[placeholders]` on purpose.
- [ ] Have a lawyer review the texts in the 5 languages (they were written for Evalorio, not copied).
- [ ] Sign/accept the DPAs: Supabase, Vercel, the email provider, Cloudflare; switch map tiles from
      tile.openstreetmap.org to a commercial provider with a DPA (`NEXT_PUBLIC_MAP_TILE_*`).
- [ ] Confirm the Supabase project region (Project Settings → General) and put it in `NEXT_PUBLIC_DATA_REGION`.
- [ ] Create the `privacy@` and `support@` mailboxes; the support address is also the DSA single point of contact.
- [ ] Set `CRON_SECRET` on Vercel (alerts + `/api/cron/maintenance`).
- [ ] Remove the demo accounts (public password).

## Where each requirement lives

| Requirement | Implementation |
| --- | --- |
| Consent before non-essential storage/tracking (ePrivacy Art. 5(3)) | `lib/consent/registry.ts` (single list of everything on the device), `components/consent/*`. Optional tools mount only inside `<ConsentGate>` |
| Reject as easy as accept, no cookie wall, granular choice | Banner with equal "Reject all" / "Accept all" + "Customize"; site usable without choosing |
| Withdraw at any time (Art. 7(3)) | "Cookie settings" in the footer, on the cookie policy and in account settings |
| Proof of consent (Art. 7(1)) | `consent_records` table via `recordConsent` (random id, choice, policy version, hashed IP) |
| Re-consent | Bump `POLICY_VERSION` in `lib/legal/company.ts`; choices also expire after 12 months |
| Global Privacy Control | Treated as "reject all" |
| Transparency (Arts. 13–14) | Privacy policy, cookie policy (table generated from the registry), notices on forms |
| Access / portability (Arts. 15, 20) | Settings → download JSON (`/api/account/export`) |
| Erasure (Art. 17) | Settings → delete account (removes listings, photos, messages) |
| Other rights, requests by email | `/privacy/request` → `privacy_requests` (reference, 1-month due date) → `/admin/privacy` |
| Storage limitation (Art. 5(1)(e)) | `gdpr_retention()` pg_cron job daily; `/api/cron/maintenance` deletes unconfirmed accounts after 7 days |
| Data minimisation / security (Arts. 5, 25, 32) | Hashed IPs, EXIF stripped client-side, exact address private (`listing_private`), fuzzed map pin, RLS everywhere |
| DSA notice-and-action, statement of reasons (Arts. 16, 17) | Report form; owners notified on rejection/removal/suspension with the reason and how to appeal; reporters notified of the outcome |

## Record of processing activities (Art. 30)

| Activity | Data subjects | Data | Legal basis | Retention | Recipients |
| --- | --- | --- | --- | --- | --- |
| Accounts | Users | Email, password hash, name, language, phone | 6(1)(b) | Until deletion; unconfirmed 7 days | Supabase |
| Listings | Owners | Property data, photos, private address, contact | 6(1)(b) | Until deletion | Public (except private data), Supabase |
| Messages | Buyers, owners | Name, email, phone, message | 6(1)(b) | 24 months | Owner, email provider |
| Phone reveals | Visitors | Listing, user id, hashed IP | 6(1)(f) | Hashed IP 90 days | — |
| Reports | Reporters | Reason, details, email, hashed IP, language | 6(1)(c), 6(1)(f) | 24 months after closing; IP 12 months | Moderators |
| Moderation log | Owners | Actions, notes | 6(1)(c), 6(1)(f) | 36 months | Moderators |
| Consent records | Visitors | Consent id, choice, hashed IP | 6(1)(c) | 36 months | — |
| Privacy requests | Requesters | Email, name, request | 6(1)(c) | 36 months after closing; IP 90 days | Moderators |
| Analytics (opt-in) | Visitors | Cookieless page views | 6(1)(a) | Aggregates | Vercel |
| Rate limiting | Visitors | Hashed IP counters | 6(1)(f) | 2 days | — |

## Handling a privacy request

1. The request arrives at `/admin/privacy` (admins also get an email). The clock is one month (`due_at`).
2. If the requester has no account with that email, or there is doubt, set **Verifying identity** and
   reply from the privacy mailbox asking only for what is needed (usually: reply from the account email).
3. Do the work. Access/portability: the JSON export. Erasure: delete the account in Supabase
   (cascades) or the specific data. Objection/restriction: note what was changed.
4. Reply to the requester, set **Completed** (or **Rejected** with the legal reason) and write a note.
5. If more time is needed (max +2 months), tell the requester why before the first month ends.

## Personal data breach

1. Contain (rotate keys, block access) and record what happened, when, which data and how many people.
2. Within **72 hours** of becoming aware: notify the lead authority unless the breach is unlikely to result in
   a risk (Art. 33). Partial information is fine; complete it later.
3. If the risk to people is high, inform them without undue delay in plain language (Art. 34).
4. Keep an internal breach register even for breaches that are not notified.

## Adding a new tool, cookie or processor

1. Add it to `DEVICE_ITEMS` in `lib/consent/registry.ts` with the right category, and its texts
   (`consent.items.<key>`) in the 5 message files.
2. If optional, mount it inside `<ConsentGate category="…">`.
3. Add the processor to section 6 of the privacy policy in the 5 languages and sign its DPA.
4. Bump `POLICY_VERSION` so everyone is asked again.
