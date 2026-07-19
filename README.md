# Dialed Dawg

An all-in-one fitness operating system for iPhone, built as an offline-capable PWA.
Workouts, recovery, nutrition, hydration, and body metrics feed one connected local
data layer — designed to grow into meal prep, AI coaching, analytics, and more.

## Status — Phase 1: Foundation

Shipped and working end-to-end:

- **App shell** — bottom tab navigation (Home · Workout · Recovery · Nutrition · Progress · More), HashRouter, lazy-loaded routes, safe-area/notch handling, 100dvh layout, dark-only Apple-inspired design system.
- **Home** — calories remaining ring, macro rings, today's workout, day streak, body readiness, weekly goal, hydration quick-add, 30-day weight trend.
- **Workout** — start empty workout or from a template, live session (survives reload), exercise picker over a seeded database of ~60 movements, per-set weight/reps/complete tracking, workout history with volume and duration, exercise library with search + muscle filters.
- **Recovery** — per-muscle fatigue computed from completed working sets (primary vs. secondary muscle weighting), linear 72-hour decay, body readiness score, grouped muscle readiness view.
- **Nutrition** — calorie/macro/fiber tracking with targets, meal-sectioned food log, quick re-log of recent foods, water tracking.
- **Progress** — daily weigh-ins (unit-aware, kg stored internally), 90-day trend chart, weekly training consistency chart.
- **Settings** — profile, lb/kg units, daily targets, weekly goal, full JSON export/import of the local database.

Roadmap modules (Meal Prep, AI Coach, Peptides, Analytics, Calendar) are visible
under **More** and marked "Soon".

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
