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
  their full record in a drawer.

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

Next.js 15 (App Router) + TypeScript + Tailwind, Prisma on SQLite for local dev, server
actions for all writes (no separate API layer except one CSV export route). Auth is a
dev-only "sign in as" picker over the seeded roster — see `src/lib/auth.ts` for exactly what
to swap for Supabase magic-link auth when this deploys to `circle.rothenhall.com`.

Brand tokens are lifted verbatim from the house brand system into `tailwind.config.ts`.

## Run it

```bash
npm install
npm run db:push     # create prisma/dev.db from the schema
npm run db:seed      # seed a full cohort: 10 ambassadors, 20 tasks, submissions in every state
npm run dev
```

Sign in at `/` by picking any seeded account. `kunal@rothenhall.com` is the admin.

## What's real vs. stubbed

**Fully working:** the task/submission/review/Signal ledger loop end to end, all seven
submission form types, the admin review queue (keyboard shortcuts, rubric checklist, oldest-
first triage), rewards with locked/earned/claimed/fulfilled states, the public application
form, the public certificate verify page, the CSV export of the measurement corpus.

**Stubbed for this preview build, noted in code where it matters:**
- Auth (`src/lib/auth.ts`) — a "continue as" picker, not real magic-link auth.
- File uploads store small base64 previews in SQLite directly, not Supabase Storage.
- Link-submission "snapshotting" does a real fetch server-side but only extracts `<title>`.
- The admin Tasks screen is read plus a publish toggle, not the full task editor from
  the spec's build order — task content itself is authored in `prisma/seed.ts`.

## Seed data

`prisma/seed.ts` places the cohort at week 5 of 12 on purpose: enough history for every
screen to have real data, early enough that later-track tasks are honestly still locked
rather than faked open. The review queue is seeded with five pending B2 submissions aged 4h
to 61h, so the "oldest unreviewed" alarm on `/admin` has something true to show past its
48-hour target. One ambassador (Aditya Singh) is seeded further along than the calendar
strictly allows, noted in the seed file, purely so the certificate, byline, and fulfilled-kit
UI states all have something real to render.
