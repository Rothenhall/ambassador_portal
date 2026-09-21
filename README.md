# Campus Circle

The ambassador portal for Rothenhall's Campus Circle, Cohort 01. Two faces, one Next.js app:
the ambassador console and the operator console used to keep review under 48 hours.

The program design and UI spec (`PLAN.md`, `UI-SPEC.md`) are kept in the private working
repo, not here. The build below diverges from that spec's route map on purpose: no sidebar,
no separate page per section. Each console
is one page — a compact tab strip, not a nav rail — with task and ambassador detail opening in
a slide-over drawer instead of a navigation. Everything is fetched once per load and switching
tabs or opening a drawer is instant, no refetch.

- **Ambassador** (`/home`): header with Signal inline, then Tasks / Progress / Rewards /
  Circle / Library as tabs. Profile editing is folded into Circle rather than kept separate.
  Clicking any task opens its brief, rubric, and submission form in a drawer.
- **Admin** (`/admin`): Overview / Review / Ambassadors / Tasks / Applications / Rewards /
  Settings as tabs (Settings absorbs the old Content screen). Clicking an ambassador row opens
  their full record in a drawer, and that drawer is where the managing happens: tier, role,
  suspend, a Signal adjustment with a reason that lands in their ledger, a fresh sign-in link,
  revoke every session, issue the certificate.
- **Authoring** lives in the same console, not a separate back office. Tasks are created and
  edited with their rubric and per-format options (link, link set, document, uploads, table,
  roster, scored assessment); rewards, library modules, campuses and cohorts are all editable;
  an accepted application or a manual "add person" produces a real invited account. A reviewer
  sees the same screens read-only where they cannot act.

## Design language

Colour is Rothenhall's own house palette and the real marks live in `public/brand/`. The
*shape* language — large soft-cornered
panels, wide low-opacity shadows, heavy tightly-tracked display type, a faint grid ground with
warm radial glow, frosted translucent surfaces, pill segmented controls — is modelled on
chatpress.heapvue.com, with its greys swapped for the house palette. Type is Urbanist
(titles, subtitles, eyebrows, figures) over Poppins (body). Motion runs through Framer Motion
on one easing curve.

The source logo PNGs have an opaque white ground, so `components/brand/Logo.tsx` keys it out
with blend modes (`multiply` on light surfaces, `invert` + `screen` on dark) rather than
shipping re-cut alpha assets.

## Progress model

Ambassadors see a persistent hero on every tab: a goal ring showing progress toward the
*next* gate (not toward 1000 — a gap you can close this week reads as reachable), the tier
road from Ambassador to Alumnus with the current position marked, and week/cohort/streak
meters. Signal figures count up rather than snap whenever they change.

## Stack

Next.js 15 (App Router) + TypeScript + Tailwind, Prisma on **Postgres** with real migrations in
`prisma/migrations`, server actions for all writes (no separate API layer except one CSV export
route), zod at every write boundary. Brand tokens are lifted verbatim from the house brand
system into `tailwind.config.ts`.

**Identity is app-owned.** Two ways in, both ending in the same revocable session row: a
password (scrypt, cost 2^15, salted, parameters stored inside the hash string) or a one-time
emailed magic link (`MagicLink` row, single use, 15 minutes, five guesses then burnt). A failed
password attempt answers identically whether the address is unknown, has no password set, or
got the password wrong — and costs the same work either way, because a login form that says
"no such account" is a roster. Eight failures per address per ten minutes, then a wait.
Accounts start `invited` with no password and may stay link-only; setting a first password
needs no proof of an old one, changing it does. An admin can reset anyone's password from their
record, which also signs that person's existing sessions out. Middleware redirects strangers by cookie presence only — that is a
fast-path nicety, not the boundary. The boundary is `getSession` plus the role checks in
`(admin)/layout.tsx`, `(ambassador)/layout.tsx` and both pages, which every request reaches.
`reviewer` may grade; only `admin` may decide applications, publish tasks, fulfil rewards,
post announcements or revoke a certificate.

**The database is the record.** Quiz answers are scored server-side from the answer key, which
is never sent to the browser before an attempt is graded. Reward `earned` is a row the server
writes (`syncEarnedGrants`), not a calculation in the panel, and claiming checks the row and
the tier/Signal gates. `in_review` is a real state: opening an attempt assigns it, and a second
reviewer is told who holds it. Decisions, publishing, provisioning and revocations all land in
`AuditEvent`. Signal is applied with an increment inside the same transaction as the review,
and the transaction refuses if the attempt was already graded — so no attempt can pay out
twice.

## Run it

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL / DIRECT_URL
npm run db:deploy         # or db:migrate while developing
npm run db:seed            # a full cohort: 10 ambassadors, 20 tasks, submissions in every state
npm run dev
```

Locally the database is a dedicated `campus_circle` Postgres 17 database (kept separate from
that container's own app data); nothing in this project assumes that host, only the two URLs.

Sign in at `/`. Without `RESEND_API_KEY` the sign-in URL is printed to the server console
instead of emailed. The seed gives fixed passwords to the two operator accounts and random ones
to the ambassadors, printing the whole table once:

| account | email | password |
| --- | --- | --- |
| admin | `kunal@rothenhall.com` | `Circle-Operator-2026` |
| reviewer | `ishaan@rothenhall.com` | `Circle-Review-2026` |
| ambassadors | `aditya.singh@campus.circle` and nine others | generated per seed run, printed by `npm run db:seed` |

Those operator passwords are seed data for a preview cohort — change them from
Settings → Your password before anything real uses this database. With
`NEXT_PUBLIC_ALLOW_DEV_SIGNIN=1` in development, the sign-in page also carries a collapsed
"continue as" picker for clicking through quickly; it is refused server-side outside a local
dev server.

## Verify it

```bash
npm run typecheck
npm run verify      # 46 logic checks: SSRF and scheme guards, payload limits, scoring,
                    # reward gates, authoring validation, magic-link single use,
                    # earned-grant idempotency, password hashing, policy and timing
npm run verify:ui   # 48 browser checks against the running app: role guards, the review
                    # accept path end to end, reviewer lockout, provisioning, XSS refusal on
                    # a profile URL, honest mail state, and the authoring surface — create a
                    # person, adjust their Signal, change their tier, suspend them and fail
                    # to get back in, author and edit a task, add a reward and a campus,
                    # password sign-in on both faces, throttling, admin reset and rotation
npm run verify:prod # 30 edge-surface checks: the CSP and its per-request nonce, the static
                    # hardening headers, that every inline script Next emits carries that
                    # nonce, and — in a real browser — that the page paints visible copy,
                    # blocks nothing, navigates client-side and shows no dev sign-in picker
```

`verify:ui` drives real writes, so reseed (`npm run db:reset` then `npm run db:seed`) before a
clean pass. It needs a Chromium browser and playwright-core or playwright (set `CC_PLAYWRIGHT`
if neither is installed in this project).

`verify:prod` needs no database, but must run against `npm run build && npm run start` — or a
deployed URL via `CC_URL=https://…` — never the dev server, which deliberately carries no CSP.
It exists because a `script-src 'self'` with no nonce blocked the App Router's own inline
bootstrap scripts and served a blank white page at HTTP 200: the policy read correctly in
isolation, and only "can a visitor actually read this?" caught it.

## What's real vs. stubbed

**Working end to end:** the task / draft / submit / review / Signal ledger loop including the
48-hour queue alarm and rubric-gated decisions; the reward ladder with locked / earned /
claimed / fulfilled states and shipping-address capture; certificate issuance on fulfilment and
public verification with revocation; the public application form through to a provisioned,
invited ambassador account; announcements; publish/unpublish; the CSV export of the measurement
corpus; link snapshots that record what a reviewer would have seen.

**Still stubbed, and stated where it matters in code:**
- **Deploy target.** The Supabase project this app was linked to (`campus-circle`,
  `hixnktighbucydjndovx`) has been deleted — its host no longer resolves and its pooler rejects
  the tenant. A new Postgres (or a new Supabase project) has to be provisioned and
  `DATABASE_URL` / `DIRECT_URL` pointed at it before `campusscout.rothenhall.com` can serve real
  people. Rate limiting and magic-link state are per-process in memory or in the database, so a
  multi-instance deploy needs Redis for the limiter.
- **Uploads** are stored as base64 inside the Postgres `Json` column: mime, extension, size
  (1.75 MB) and count are all validated and capped, but Supabase Storage is not wired.
- **Nothing is deleted.** A task that ambassadors have submitted against keeps its code and
  submission format frozen and can only be unpublished; people are suspended, never removed.
  That is deliberate — the ledger and the audit trail are the product.
- **Notifications** are email-only and only for magic links, invites and application receipts.
  No "your submission was accepted" mail, no in-app notification centre, no digest.
- **Snapshots** extract title and description by reading up to 300 KB of HTML; no rendering,
  no screenshot, and the SSRF guard checks the hostname rather than resolved addresses, so DNS
  rebinding is not defeated.
- **Admin decisions on applications** are recorded and provision an account, but rejection sends
  no email on purpose — that one stays human.
- **No bulk operations and no import.** Adding a cohort of forty means forty clicks, or the
  seed script. A CSV importer is the obvious next thing.
