# TRAZA — Implementation Plan

Version: 1.0  
Date: 2026-07-30  
Status: Awaiting approval  
Author: Lead / Staff Product / Senior UI review

---

## 1. Project summary

TRAZA is a **premium personal performance tracking platform**: training journal + body/health metrics + long-term progress, designed to feel as polished as Freeletics, Oura or Linear.

It is **not** a calorie app, social network, AI coach, or wearable replacement. The MVP serves a consistent trainer who wants fast one-handed logging and beautiful historical clarity.

**Current reality of the repository**

| Area | State |
|------|--------|
| Product / design / architecture docs | Complete (at repo root, not `/docs`) |
| Brand assets | 3 logos in `public/logos/` |
| Exercise illustrations | 29 PNGs 1200×1500 in `public/exercises/` |
| Seed data | `exercise_seed.json` (29) + `workout_seed.json` (Day A/B/C + Home) at root |
| Application code | **Does not exist** (`app/`, `components/`, `features/` missing) |
| Git | No initialized repository detected |
| Phase | Foundation (Sprint 0) — blocked on this plan |

**Product modules (MVP)**

1. Dashboard (Home)
2. Calendar
3. Training (templates, sessions, rest timer, summary)
4. Progress (charts / trends)
5. Reports (CSV / PDF)
6. Administration (exercises, routines, settings)

**Non-negotiables from documentation**

- Mobile-first (390px reference); desktop adapts, does not redesign flows
- UX over features; no half-finished screens
- Light theme only in MVP
- Local storage before Supabase (Decision 002)
- Template versioning; immutable workout history (Decisions 001, 005)
- UI copy in **Spanish (Spain)**; all code/identifiers in **English**

---

## 2. Proposed architecture

Follow `06_ARCHITECTURE.md` strictly. Do not invent layers.

```
UI (components)  →  Pages (compose)  →  Actions (orchestrate)
                                            ↓
                                      Repositories
                                            ↓
                         Local DB adapter  →  (Phase 5) Supabase
```

### Stack (locked by docs)

| Concern | Choice |
|---------|--------|
| Framework | Next.js App Router |
| Language | TypeScript strict |
| Styling | Tailwind CSS + CSS variables from design tokens |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Icons | Lucide |
| Dates | date-fns |
| Deploy | Vercel (later) |
| Backend | Local mock first → Supabase (Phase 5) |

### Critical architectural decision: repository-first local layer

Phase 0–4 must **not** call `localStorage` from components or hooks.

Proposed contract:

```
features/*/repositories/*
        ↓
lib/db/client.ts          // Storage adapter interface
lib/db/local/*.ts         // Local implementation (structured JSON)
lib/db/supabase/*.ts      // Phase 5 swap — same interface
```

**Why:** Decision 002 prioritizes UX iteration with local data, but Architecture forbids scattering data access. A thin `DbClient` interface keeps Phase 5 a swap, not a rewrite. UI stays unchanged (Roadmap Phase 5 DoD).

**Recommended local persistence:** a single versioned local store (e.g. `localStorage` / IndexedDB via a small adapter) with:

- schema version
- seed bootstrap on first launch
- typed collections mirroring future PostgreSQL tables
- soft-delete / archive flags where history matters

IndexedDB is preferred for workout session payload size and charts history; `localStorage` is acceptable for MVP if the adapter abstracts it. **Recommendation: IndexedDB (idb) or a minimal custom IndexedDB wrapper** — one dependency max, justified by session volume.

### Server vs client

| Default | Server Components |
|---------|-------------------|
| Client only when needed | Forms, animations, charts, workout mode, calendar, sheets, timers |

With a **local-only** Phase 0–4, “Server Actions” become **feature actions** that still orchestrate repositories. They can run on the client initially *or* as Next.js Server Actions writing to a server-side file store.  

**Recommendation for Phase 0–4:** keep actions as **client-callable feature functions** behind the same naming (`createWeight`, `finishWorkout`) that later become Server Actions talking to Supabase. Avoid pretending we have a remote DB. Document this clearly in STATUS when Phase 0 starts.

### Auth (MVP)

Single-user local profile seeded from docs (“Higinio”). No login until Phase 5. Settings “Logout” can be a no-op or clear local data with confirmation — **open point** (see §8).

### i18n / copy strategy

No full i18n framework in MVP.

```
lib/copy/es.ts   // All user-visible strings (ES-ES)
```

Components receive labels from copy maps or props. `08_COPYWRITING.md` currently lives in **English**; Spanish UI is a product requirement that **overrides** English marketing copy for the shipped interface. Technical docs stay English.

---

## 3. Folder structure

Align with Architecture. Reorganize documentation and seeds during Phase 0 (no behavior change).

```
traza/
├── PLAN.md                          # This file
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     # → redirect or Home
│   ├── (app)/
│   │   ├── layout.tsx               # Shell + BottomNavigation
│   │   ├── loading.tsx
│   │   ├── home/page.tsx
│   │   ├── calendar/page.tsx
│   │   ├── train/
│   │   │   ├── page.tsx             # Start / select
│   │   │   ├── [sessionId]/page.tsx
│   │   │   ├── rest/page.tsx
│   │   │   └── summary/page.tsx
│   │   ├── progress/page.tsx
│   │   └── more/
│   │       ├── page.tsx
│   │       ├── exercises/
│   │       ├── routines/
│   │       ├── export/
│   │       └── settings/
│   └── globals.css                  # or styles/globals.css
├── components/
│   ├── layout/                      # PageHeader, shell
│   ├── common/                      # HeroCard, MetricCard, StatChip, HistoryRow
│   ├── forms/                       # PrimaryButton, inputs
│   ├── navigation/                  # BottomNavigation, BottomSheet
│   ├── feedback/                    # Toast, EmptyState, LoadingSkeleton, Dialog
│   ├── charts/                      # ChartCard, WeightChart, …
│   ├── training/                    # Presentational workout UI only
│   ├── dashboard/
│   └── calendar/
├── features/
│   ├── dashboard/
│   ├── calendar/
│   ├── training/
│   ├── weight/
│   ├── blood-pressure/
│   ├── steps/
│   ├── sleep/
│   ├── measurements/
│   ├── progress/
│   ├── export/
│   ├── exercises/
│   └── settings/
│       ├── components/
│       ├── actions/
│       ├── repositories/
│       ├── schemas/
│       ├── types/
│       ├── utils/
│       └── hooks/
├── lib/
│   ├── db/
│   ├── copy/
│   ├── date/
│   ├── format/
│   ├── constants/
│   └── env/
├── styles/
│   └── tokens.css                   # CSS variables from DESIGN_TOKENS
├── types/
├── seed/
│   ├── exercise_seed.json
│   └── workout_seed.json
├── public/
│   ├── logos/
│   └── exercises/
└── docs/
    ├── 00_PRODUCT.md
    ├── …
    ├── STATUS.md
    └── DECISIONS.md
```

**Aliases:** `@/` → project root (Architecture requirement).

---

## 4. Data model summary

Source of truth: `05_DATABASE.md`. Local store mirrors these entities so Supabase migration is mechanical.

### Daily tracking (1 row per user + date)

| Collection | Key fields | Unique |
|------------|------------|--------|
| `weight_entries` | `weight_kg`, optional `body_fat_pct`, `entry_time` | `user_id + entry_date` |
| `blood_pressure_entries` | `systolic`, `diastolic`, `pulse` | same |
| `step_entries` | `steps` | same |
| `sleep_entries` | `bed_time`, `wake_time`, `duration_minutes`, `score` | same |
| `body_measurements` | `waist_cm`, `right_arm_cm`, `right_thigh_cm` | same |

### Catalog & routines

| Collection | Role |
|------------|------|
| `exercise_groups` / `exercise_types` / `load_types` | Lookup tables (prefer over PG enums) |
| `exercises` | Master library + `image_path`, tips, archive |
| `exercise_alternatives` | M2M substitutions |
| `workout_templates` | Day A / B / C / Home |
| `workout_template_versions` | Immutable versions on edit |
| `workout_template_exercises` | Sets, reps, RIR, rest, `pair_group`, order |

### Execution

| Collection | Role |
|------------|------|
| `workout_sessions` | `status`: completed / partial / cancelled |
| `workout_session_exercises` | planned vs performed exercise, order, skip |
| `workout_sets` | load, reps, duration |

### Identity

| Collection | Role |
|------------|------|
| `profiles` | Single seeded user for MVP |

### Seed ↔ schema gap (must resolve in Phase 0 types)

`exercise_seed.json` includes fields **not** in DATABASE.md:

- `slug`, `secondaryMuscles`, `movementPattern`, `equipment`, `defaultSets`, `defaultRepRange`, `defaultRestSeconds`, `defaultRir`, `isBilateral`, `isSeed`

`workout_seed.json` includes:

- `slug`, `estimatedDurationMinutes`, nested `pair`, cardio `durationMinutes`

**Proposal (recommend approving):**

1. Keep DB schema as documented for persistence shape.
2. Treat extra seed fields as **catalog metadata** mapped into:
   - `technique_tip` / `configuration_note`
   - template exercise rows (sets, reps, RIR, rest, pair)
   - optional JSON `metadata` **only if needed** — prefer not adding undocumented columns; map into existing fields or lookup tables.
3. Introduce `slug` as a stable local/import key (useful); add to docs via DECISIONS if we persist it.
4. Align lookup values: seed uses `trackingType: Repetitions | Time | Weight | Cardio` and `loadType: Bodyweight | N/A | …` vs DB `Weight | Bodyweight | Time | Cardio` and `Total Weight | Per Dumbbell | Per Side | Assistance`. **Normalize during seed import.**

History rule: template edits create new versions; past sessions keep `template_version_id` forever.

---

## 5. Implementation strategy

### Principles

1. Documentation wins over assumptions.
2. One small phase at a time; app remains runnable after each phase.
3. Experience of existing flows > new features.
4. No placeholder screens that ship empty for months.
5. Tokens only — no hardcoded colors, spacing, radius, shadows, durations.
6. Reuse components; compose screens from the six component families.
7. UI Spanish (Spain); code English.

### Design system bootstrap (Phase 0)

1. Encode `02_DESIGN_TOKENS.md` as CSS variables + Tailwind theme extension.
2. Build **presentational** component library from `03_COMPONENTS.md` with Story-less visual QA on a `/dev/ui` route (dev-only) **or** a static gallery page — optional, remove before launch.
3. Wire Bottom Navigation (Home · Calendar · **Train** · Progress · More) with Train emphasized.
4. App shell: safe areas, 390 reference, max content widths from tokens.
5. Seed local DB; show Dashboard **shell** with HeroCard + empty/metric placeholders using EmptyState patterns — looks premium, limited logic.

### Feature delivery order (matches Roadmap, refined)

Prefer vertical slices that touch real UX early:

1. Foundation (visual + shell + local DB)
2. Daily tracking end-to-end (forms → calendar → home metrics)
3. Training engine (the product’s emotional core)
4. Progress charts
5. Exports
6. Supabase + auth
7. Polish pass (animations, a11y, performance)
8. V1 checklist

**Polish is listed as Phase 6 in the roadmap, but micro-polish must happen inside each phase.** Phase 6 is the dedicated consistency pass, not the first time we add motion.

### Quality gates (Definition of Done per feature)

From Development Guide — a feature is done only when it:

- works
- looks premium
- is responsive
- is accessible
- has loading / empty / error / success states
- follows design system + docs
- is deployable

### Copy

Create `lib/copy/es.ts` from `08_COPYWRITING.md`, translated to ES-ES. Examples:

| EN (docs) | ES-ES (UI) |
|-----------|------------|
| Start Workout | Empezar entrenamiento |
| Continue Workout | Continuar entrenamiento |
| Complete Set | Completar serie |
| Finish Workout | Finalizar entrenamiento |
| Record Weight | Registrar peso |
| Weight | Peso |
| Save | Guardar |
| Delete | Eliminar |
| Cancel | Cancelar |

Numbers: `95,45 kg`, dates: `30 de julio de 2026` (locale `es-ES`).

---

## 6. Development phases

Aligned with `09_ROADMAP.md`, with Phase 0 broken into executable checkpoints.

### Phase 0 — Foundation

**Goal:** The app already *looks* like a commercial product. Minimal business logic.

| Checkpoint | Deliverable |
|------------|-------------|
| 0.1 | Next.js + TS strict + Tailwind + path aliases |
| 0.2 | Move docs → `/docs`, seeds → `/seed`; update STATUS |
| 0.3 | Design tokens (CSS vars + Tailwind) |
| 0.4 | Font Inter (Next Font), global styles, selection/scrollbar |
| 0.5 | Core UI: buttons, inputs, HeroCard, MetricCard, PageHeader, StatChip, sheets, toast, skeleton, empty state |
| 0.6 | App shell + Bottom Navigation + route stubs that use real layout (not blank “Coming soon” walls — use EmptyState with honest copy) |
| 0.7 | Local DB client + seed import (exercises, templates v1, profile) |
| 0.8 | Logo in shell; responsive shell QA on 390 / desktop |

**DoD:** Navigable premium shell; tokens enforced; seeds loaded; no fake CRUD.

### Phase 1 — Daily tracking

Weight, blood pressure, steps, sleep, measurements: create / edit / delete.  
Home quick metrics + quick actions. Calendar month + day bottom sheet.

### Phase 2 — Training engine

Exercise library UI, routines, versioned templates, session flow, set logging, rest timer screen, flexible order, substitution, summary.  
**Highest UX bar of the product.** Do not rush.

### Phase 3 — Progress

One chart per view: weight (points + 7-day MA + target), measurements, training/exercise, sleep, BP, steps.

### Phase 4 — Exports

Date range → modules → CSV / PDF. Dynamic generation only.

### Phase 5 — Supabase

Auth, Postgres schema from DATABASE.md, RLS, typed client, repository swap. UI unchanged.

### Phase 6 — Polish

Motion system consistency, skeletons everywhere, a11y audit, performance, responsive edge cases.

### Phase 7 — V1 release

Roadmap checklist; daily-driver readiness.

---

## 7. Detected risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Copy docs in English vs mandatory ES-ES UI** | High | Translate all UI strings; treat COPYWRITING as tone guide; maintain `lib/copy/es.ts` as source of truth for UI |
| **Seed schema ≠ DATABASE.md** | High | Explicit seed mapper; document `slug` + lookup normalization in DECISIONS |
| **Docs at root vs Architecture `/docs`** | Medium | Reorganize in Phase 0.2 |
| **Local → Supabase rewrite risk** | High | Repository + `DbClient` interface from day one |
| **Workout Mode complexity** | High | Phase 2 as dedicated multi-sprint work; no parallel feature sprawl |
| **Token inconsistencies** | Medium | Input radius `16` not in radius scale (8/12/18/24/32/40); Primary Hover only in tokens — codify tokens file as authority, note in DECISIONS |
| **Design System vs external “no cards / no Inter” heuristics** | Low | **Documentation wins.** TRAZA is card-based and Inter-based by design |
| **Phase 6 polish deferred too late** | Medium | Ship motion/empty/loading with each screen; Phase 6 = audit |
| **PNG illustrations (tokens prefer WebP)** | Low | Keep PNG masters now; optional WebP optimization later |
| **No git repository** | Medium | Initialize git in Phase 0.1 with sensible `.gitignore` |
| **Single-user “Logout” without auth** | Low | Defer meaningful logout to Phase 5; Settings shows profile only or “Clear local data” |
| **Optimistic UI with local DB** | Low | Still use optimistic patterns for perceived speed |
| **Pair supersets / cardio duration in seeds** | Medium | Model `pair_group` and `target_seconds` / duration in template exercises during import |

### Architecture critique (constructive)

1. **“Actions must never call Supabase” + “Repositories only”** is correct. For local MVP, enforce the same: **actions → repositories → db client**. Do not short-circuit.
2. **Roadmap puts Supabase after Exports.** Good for UX speed; risk is building local-only assumptions (e.g. sync, multi-tab). Keep user_id on every row from day one.
3. **Architecture lists `/docs` but repo has docs at root.** Structure debt — fix early.
4. **STATUS.md filename vs internal title `PROJECT_STATE.md`** — rename content title to STATUS for consistency.
5. **Bottom nav labels in SCREEN_SPECS are English** (“Home”, “Train”…). UI must be Spanish: propose **Inicio · Calendario · Entrenar · Progreso · Más**.

---

## 8. Open questions / doubts

Awaiting product approval before implementation:

1. **Local persistence engine:** IndexedDB vs `localStorage`? → Recommendation: **IndexedDB**.
2. **Persist `slug` on exercises/templates?** → Recommendation: **Yes**, add to DATABASE.md via Decision 006.
3. **Extra seed metadata** (equipment, movement pattern, secondary muscles): persist, discard, or `metadata` JSON? → Recommendation: **discard from persistence for MVP**; keep only what DATABASE.md needs. Equipment/secondary can return later.
4. **Settings Logout** before auth? → Recommendation: hide Logout until Phase 5; optional “Borrar datos locales”.
5. **Target weight line on charts:** where is the goal stored? Not in DATABASE.md. → Need Decision (simple `goals` later vs hardcode in settings). Recommendation: **defer target line data** until a minimal `user_goals` or settings field is approved; chart can omit target until then **or** add `profiles.target_weight_kg`.
6. **Greeting name:** always “Higinio” from seed profile?
7. **Dev UI gallery route:** allow `/dev/ui` in development?
8. **Initialize git + remote?** Confirm before Phase 0.1.
9. **Exercise/group names in UI:** keep English exercise names from seed (“Hack squat”) or translate? → Recommendation: **keep exercise proper names as in seed** (gym convention); translate chrome/UI only.
10. **Routine names:** “Day A” → **“Día A”** in UI?

---

## 9. Recommended build order

Strict sequence (do not parallelize major phases):

```
0. Approve PLAN.md
1. Phase 0.1–0.2  Tooling + folder hygiene
2. Phase 0.3–0.5  Tokens + core components
3. Phase 0.6–0.8  Shell + navigation + local DB + seeds
4. STOP — visual review of shell (treat as design QA gate)
5. Phase 1         Daily tracking (Weight first, then others)
6. Calendar integration for daily data
7. Dashboard wiring for real metrics / CTAs
8. Phase 2         Training (library → templates → active workout → rest → summary)
9. Phase 3         Progress charts
10. Phase 4        Exports
11. Phase 5        Supabase migration
12. Phase 6        Polish audit
13. Phase 7        V1 release
```

**Within Phase 1, build Weight first** as the reference pattern (schema, bottom sheet form, MetricCard, calendar row, optimistic save). Clone the pattern for BP, steps, sleep, measurements.

**Within Phase 2, build in this order:**

1. Exercise list + detail (read-only)
2. Routine list + detail (read-only from seed versions)
3. Start workout → active set logging
4. Rest timer (dedicated screen)
5. Exercise list / reorder / skip / substitute
6. Summary + finish
7. Template editing + versioning (after execution feels excellent)

---

## 10. Phase 0 checklist

Use this as the execution checklist after PLAN approval. Do not start Phase 1 until all items are done.

### Project bootstrap

- [ ] Initialize git repository and `.gitignore` (Node, `.env*`, `.DS_Store`, Next artifacts)
- [ ] Create Next.js App Router project (TypeScript strict)
- [ ] Configure Tailwind CSS
- [ ] Configure `@/` absolute imports
- [ ] Add core dependencies: `lucide-react`, `date-fns`, `zod`, `react-hook-form`, `@hookform/resolvers`
- [ ] Defer Recharts until Progress phase (or add later) — avoid unused weight in Phase 0
- [ ] Environment example file without secrets

### Repository hygiene

- [ ] Move documentation into `/docs` (keep numbering)
- [ ] Move `exercise_seed.json` + `workout_seed.json` into `/seed`
- [ ] Keep `public/logos` and `public/exercises` as-is
- [ ] Update STATUS.md (path + sprint notes)
- [ ] Record structural decisions in DECISIONS.md (slug, IndexedDB, copy strategy, nav labels ES)

### Design system

- [ ] Implement CSS variables for all tokens in `02_DESIGN_TOKENS.md`
- [ ] Map tokens into Tailwind theme (`colors`, `spacing`, `radius`, `shadow`, `fontSize`, `transitionDuration`)
- [ ] Load Inter via `next/font` (weights 400–700 only)
- [ ] Global background `#F6F7F3`, selection, focus ring styles
- [ ] Tabular figures utility for numbers
- [ ] Safe-area utilities for bottom nav

### Component library (presentational only)

- [ ] `PrimaryButton` / `SecondaryButton` / `GhostButton` / Danger variant
- [ ] `NumberInput` / text field baseline
- [ ] `HeroCard`
- [ ] `MetricCard`
- [ ] `StatChip`
- [ ] `PageHeader`
- [ ] `HistoryRow`
- [ ] `BottomNavigation` (Train emphasized; labels ES-ES)
- [ ] `BottomSheet`
- [ ] `ConfirmationDialog`
- [ ] `Toast`
- [ ] `EmptyState`
- [ ] `LoadingSkeleton`
- [ ] Logo usage in shell

### App shell

- [ ] Root layout with font + tokens
- [ ] Authenticated-style `(app)` layout with bottom nav
- [ ] Routes: Inicio, Calendario, Entrenar, Progreso, Más
- [ ] Each route shows premium EmptyState or static Hero — **no broken links**
- [ ] Mobile 390px QA + desktop max-width behavior

### Local data

- [ ] `lib/db` client interface
- [ ] Local adapter implementation
- [ ] Seed bootstrap: profile, lookup tables, 29 exercises, 4 templates + version 1 exercises
- [ ] Normalize seed enums to DATABASE vocabulary
- [ ] Verify all exercise images resolve

### Copy & language

- [ ] Create `lib/copy/es.ts` for shell + empty states
- [ ] No English user-visible chrome in Phase 0 screens
- [ ] No mixed ES/EN in UI

### Quality bar

- [ ] No hardcoded colors/spacing/radius/shadows/durations in components
- [ ] Touch targets ≥ 48px (prefer 56)
- [ ] Keyboard focus visible
- [ ] App runs with `next dev` without errors
- [ ] STATUS.md updated to reflect Phase 0 completion state when done

### Explicitly out of scope for Phase 0

- [ ] No real create/edit of tracking data
- [ ] No workout execution
- [ ] No charts
- [ ] No exports
- [ ] No Supabase
- [ ] No dark mode
- [ ] No notifications / AI / wearables

---

## What this plan does *not* do

- Does not start coding before approval
- Does not invent features outside the docs
- Does not weaken Workout Mode UX for speed
- Does not skip the local→Supabase seam

---

## After approval

1. Update `docs/STATUS.md` (or root STATUS until moved): next task = Phase 0.1
2. Record agreed open questions in `DECISIONS.md`
3. Begin Phase 0 checklist only

**Waiting for your approval of PLAN.md before writing any application code.**
