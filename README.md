# Dialed Dawg

An all-in-one fitness operating system for iPhone, built as an offline-capable PWA.
Workouts, recovery, nutrition, hydration, and body metrics feed one connected local
data layer — designed to grow into meal prep, AI coaching, analytics, and more.

## Status — Phase 4: Meal Prep

Shipped and working end-to-end (More → Meal Prep):

- **Recipe builder + library** — create recipes with a dynamic ingredient
  list, per-serving macros (calories/protein/carbs/fat/fiber), servings, and
  instructions. Edit and delete from a detail sheet.
- **Recipe → Nutrition integration** — one tap logs a serving of a recipe to
  any meal on today's Nutrition page (macros scale by servings), tying the
  ecosystem together.
- **Shopping list** — push a recipe's ingredients to the list in one tap, add
  manual items inline, check items off, and clear completed items.
- New reusable `SegmentedControl` (iOS-style, spring thumb) drives the
  Recipes / Shopping List tabs.

All Meal Prep data persists through the localStorage store, exports/imports
with the rest of the app, and was verified end-to-end (14 checks incl. the
nutrition tie-in and reload persistence) plus a clean multi-viewport pass.

A weekly meal-plan calendar is the next Meal Prep increment.

## Storage layer rebuilt on localStorage (iOS reliability)

The installed iOS PWA was crashing on launch with `UnknownError: Unable to open
cursor`. Root cause: **IndexedDB on iOS/WebKit**. When an installed PWA is
backgrounded or the device is under memory pressure, WebKit drops the
IndexedDB connection and the next cursor operation throws — a long-standing,
unfixable WebKit failure mode. Every reactive query in the app opened a cursor,
so a single dropped connection took down the whole UI.

The fix removes IndexedDB entirely:

- **All data now lives in localStorage** via a single Zustand store
  (`src/store/dataStore.ts`). localStorage is synchronous and has no
  connection/cursor lifecycle, so the failure class cannot occur — the bundle
  contains **zero** cursor operations and no Dexie.
- **One source of truth, one instance.** The store holds workouts, templates,
  foods, food/water logs, weigh-ins, custom exercises, and muscle recovery.
  Seed exercises are re-derived from code (not persisted), keeping the payload
  small.
- **No data loss on update.** A one-time, best-effort migration
  (`src/services/legacyMigration.ts`) imports any pre-existing IndexedDB data
  using a single `getAll()` read (no cursor), runs after first paint so it can
  never block or hang startup, and fills only empty collections. Normal app
  updates only change code — persisted data in localStorage is untouched.
- **Graceful failure.** localStorage access is wrapped so a private-mode/quota
  error degrades to in-memory state instead of crashing. A top-level error
  boundary still offers Reload / Repair with a visible build stamp.

Recovery data volume fits localStorage comfortably (seed data excluded), and
the storage layer stays reactive, so every screen updates instantly as before.

## Status — Phase 3: Analytics

Shipped and working end-to-end:

- **Analytics module** (More → Analytics) — weekly training volume chart,
  per-exercise deep dives (estimated 1RM trend chart, best set, session
  history, total volume), and **Progress Watch**: rule-based plateau detection
  comparing each lift's best e1RM over the last 3 weeks against the 3 weeks
  prior, flagging progressing / plateaued / regressing lifts with actionable
  guidance.
- **Deployment hardening** — root-caused and fixed the Netlify flash-then-blank
  bug (service worker update takeover); added `netlify.toml` with explicit
  build settings, SPA fallback, and correct cache headers. Verified across the
  full SW lifecycle including live redeploys under an open session and offline.

### Phase 2 — Training depth & body map

- **Body map** — interactive front/back muscle diagram on Recovery; every muscle
  region is colored by live fatigue (green → yellow → red) and tappable for
  readiness %, last-trained, and time-to-full-recovery detail.
- **Rest timer** — completing a set starts a configurable countdown (Settings →
  Rest timer) pinned above the tab bar, with +30s and skip. Survives navigation
  and reloads.
- **Set types** — tap a set's number to cycle Working → Warmup → Drop; warmups
  are excluded from volume, fatigue, and PR calculations.
- **Templates** — save any completed workout as a template from History, start
  workouts from templates, delete templates.
- **Strength PRs** — Progress shows estimated 1RM (Epley) cards for Bench,
  Squat, and Deadlift with the best set and date that produced each.
- **Device pass** — verified at iPhone 15/16 (393×852), 16 Pro (402×874), and
  Pro Max-class (440×956) logical viewports.

### Phase 1 — Foundation

- **App shell** — bottom tab navigation (Home · Workout · Recovery · Nutrition · Progress · More), HashRouter, lazy-loaded routes, safe-area/notch handling, 100dvh layout, dark-only Apple-inspired design system.
- **Home** — calories remaining ring, macro rings, today's workout, day streak, body readiness, weekly goal, hydration quick-add, 30-day weight trend.
- **Workout** — start empty workout or from a template, live session (survives reload), exercise picker over a seeded database of ~60 movements, per-set weight/reps/complete tracking, workout history with volume and duration, exercise library with search + muscle filters.
- **Recovery** — per-muscle fatigue computed from completed working sets (primary vs. secondary muscle weighting), linear 72-hour decay, body readiness score, grouped muscle readiness view.
- **Nutrition** — calorie/macro/fiber tracking with targets, meal-sectioned food log, quick re-log of recent foods, water tracking.
- **Progress** — daily weigh-ins (unit-aware, kg stored internally), 90-day trend chart, weekly training consistency chart.
- **Settings** — profile, lb/kg units, daily targets, weekly goal, full JSON export/import of the local database.

Roadmap modules (Meal Prep, AI Coach, Peptides, Analytics, Calendar) are visible
under **More** and marked "Soon".

### Roadmap decisions (locked in, not yet built)

- **AI Coach** will run on **Claude Sonnet** (Anthropic API), called through a
  small serverless proxy (Vercel/Cloudflare Workers) so the API key never ships
  to devices. The proxy is also the future home of accounts, sync, and coach
  memory. The coach will read the same local domain model (workouts, recovery,
  nutrition, progress) to ground its answers.
- **Analytics** grows into the full progressive-overload page: per-exercise
  e1RM trend charts, weekly volume by muscle, plateau detection.

## Tech stack

React 19 · Vite · TypeScript (strict) · Tailwind CSS 4 · Framer Motion ·
React Router (HashRouter) · Zustand · Dexie (IndexedDB) · React Hook Form + Zod ·
Recharts · Heroicons · vite-plugin-pwa

## Architecture

Feature-based layout; each feature owns its components, hooks, and services.

```
src/
  app/          Router + app shell
  components/   Shared UI kit (Button, Card, Sheet, ProgressRing, …) + navigation
  features/     workout / nutrition / recovery / progress
  pages/        Route-level screens (lazy loaded)
  services/     Dexie database, recovery engine, data export/import, seed data
  store/        Zustand stores (settings, active workout session)
  types/        Domain model (single source of truth)
  utils/        Dates, units, calculations, formatting
```

Conventions:

- All weights stored in **kg**, all day-scoped rows keyed by local `YYYY-MM-DD`.
- Data lives in IndexedDB via Dexie; UI reads through `useLiveQuery` hooks so every
  screen updates reactively. Schemas are versioned for future backend sync.
- The active workout session persists to localStorage so an accidental refresh
  never loses a set.

## Development

```bash
npm install
npm run dev       # local dev server
npm run build     # typecheck + production build (PWA service worker included)
npm run lint      # oxlint
npm run icons     # regenerate PNG icons from public/icons/icon.svg
```

The build uses relative asset paths and hash routing, so it deploys to GitHub
Pages (or any static host) without configuration.
