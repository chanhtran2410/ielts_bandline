# Bandline — AI IELTS coach

An IELTS Academic (Reading & Writing) coaching product built around one loop:

```
Diagnose → detect weakness → practice → analyse mistakes → measure → adapt
```

Every screen exists to serve a step of that loop. Nothing here is a question bank.

## Stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Next.js 16 (App Router) | One deploy to Vercel; route handlers become functions, so there is no server to operate |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` | The domain has a lot of optional and indexed data |
| Styling | Tailwind CSS v4, tokens in `@theme` | One place defines every colour, radius and shadow |
| Server state | TanStack Query | Gives loading / error / retry for free, which §26 requires everywhere |
| Data | Supabase (Postgres + Auth) | Hosted, so nothing else needs running |
| Unit / component tests | Vitest + Testing Library | |
| E2E | Playwright (desktop + mobile projects) | Mobile is a real layout, so it needs real coverage |

## Getting started

```bash
npm install
cp .env.example .env.local     # optional: the app runs fully on fixtures without it
npm run dev
```

The app runs with **no backend configured**. `NEXT_PUBLIC_DATA_SOURCE=mock` (the
default) serves every screen from bundled fixtures through the real service
interfaces, so you can click the entire product before Supabase exists.

## Scripts

```bash
npm run dev         # dev server
npm run build       # production build
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test        # vitest (unit + component + flow)
npm run test:e2e    # playwright, desktop + mobile
npm run verify      # typecheck + lint + test + build
```

## Deploying to Vercel

1. Push the repo and import it at [vercel.com/new](https://vercel.com/new). Next.js
   is detected; no build settings need changing.
2. Add the environment variables from `.env.example` in **Project → Settings →
   Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your
     Supabase project's API settings. Safe in the browser.
   - `ANTHROPIC_API_KEY` — **server only**. It is read exclusively by
     `src/app/api/*/route.ts`, never by client code.
   - `NEXT_PUBLIC_DATA_SOURCE` — leave as `mock` until the Supabase schema is in
     place, then set to `supabase`.
3. Deploy. `/api/writing/analyze` and `/api/coach` become serverless functions
   automatically; everything else is static or streamed.

Nothing in this project needs a long-running server, a container, or a queue.

## Where things live

```
src/
├── app/                     routes only — thin, they delegate to features/
│   ├── (shell)/             screens with the sidebar
│   ├── (focus)/             exam sessions and results (no sidebar, by design)
│   └── api/                 server route handlers (the only place secrets are read)
├── features/                one folder per product area: screens + their hooks
├── components/
│   ├── ui/                  primitives (Button, Card, ProgressBar, …)
│   ├── layout/              shells, navigation, brand
│   └── <area>/              presentational pieces per product area
├── services/                THE data boundary — nothing else fetches
├── mocks/                   fixtures, imported only by services
├── lib/                     pure domain logic (band, grading, timer, word count)
├── hooks/                   cross-feature hooks (timer, autosave, profile)
├── types/                   the domain vocabulary
└── constants/               labels, navigation, and other lookup tables
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the rules these boundaries
enforce and why.

## Testing

```bash
npm run test        # 164 unit / component / flow tests
npm run test:e2e    # 55 browser tests across desktop and mobile
```

The suites worth knowing about:

- `src/lib/*.test.ts` — band conversion, grading, word count, timer. Pure logic,
  exhaustively covered, because a wrong band number destroys trust in the product.
- `src/features/core-loop.test.ts` — the loop itself, end to end through the
  services. **If this suite is red, the product does not work**, whatever the
  screens look like.
- `e2e/core-loop.spec.ts` — the two critical journeys in a real browser.
- `e2e/responsive.spec.ts` — no screen scrolls sideways; mobile navigation and
  the reading pane split behave as designed.
