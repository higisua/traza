# DECISIONS.md

## Decision 001

Workout templates are versioned.

Reason

Historical consistency.

---

## Decision 002

MVP starts with local storage instead of Supabase.

Reason

Prioritize UX and iteration speed.

---

## Decision 003

Mobile-first.

Desktop adapts from the mobile experience.

---

## Decision 004

The product uses a light theme only in the MVP.

Reason

Reduce complexity and maximize design consistency.

---

## Decision 005

Exercise history is immutable.

Workout template changes never modify historical sessions.

---

## Decision 006

MVP persistence uses `localStorage` (not IndexedDB).

Reason

Single user, low data volume, faster iteration. Persistence modules live in `lib/storage` and will be replaced by Supabase later without changing UI.

---

## Decision 007

Persistence is module-based (`weightStorage`, `trainingStorage`, etc.), not a generic `DbClient` abstraction.

Reason

Keep the storage layer simple and explicit for the MVP. Each module exposes a clean, consistent API.

---

## Decision 008

UI copy is not centralized in Phase 0.

Reason

Insufficient string volume yet. Strings live next to components/screens until a later consolidation.

---

## Decision 009

All motion uses Framer Motion via a shared motion system (`lib/motion`).

Reason

Avoid scattered CSS animations. One coherent, reusable animation language.

---

## Decision 010

A development-only component gallery exists at `/dev/components`.

Reason

Visual QA of the Design System before building product screens.

---

## Decision 011

PLAN.md approved (2026-07-30) with Decisions 006–010 overrides.

Reason

Product owner review before Phase 0 implementation.

---

## Decision 012

Home is a tracking-status hub, not a training-first surface.

Reason

TRAZA is a physical-state tracking product. Training is one module among peers. Home shows the last known state of each tracking module as entry points; training lives in its own block below.

---

## Decision 013

Home training block is a mode entry, not a routine reminder.

Reason

The Home must not assume which routine to do. It only invites the user to start a session; routine selection happens inside the training flow. Evolution/streak/activity belong to Progress, not Home.

---

## Decision 014

Home is art-directed as one composition, not a card mosaic.

Reason

Asymmetric visual weight and a single Estado surface. Brand lime is reserved for purposeful accents.

---

## Decision 015

Home follows the «Instrumento» system (`docs/10_HOME_SYSTEM.md`).

Reason

Concept A refined into a premium consumer composition: memorable header, unequal module hierarchy, materials/depth, warm training plane, lime reserved for the primary CTA. Optimize for desirability, not emptiness.

---

## Decision 016

Home system v2 prioritizes desirability over minimalism.

Reason

Stripping chrome produced a wireframe feel. Premium means craft, depth, color, and hierarchy — not blank space.

---

## Decision 017

Exercise catalog is a managed local entity (`traza:v1:exercises`), not a static JSON import at runtime.

Rules

- Seed exercises share the same model as user-created ones.
- Idempotent seed on first read: insert missing seed slugs only; never overwrite user edits; no duplicates.
- Historical identity is the stable `slug` (session `exerciseId` === slug). Never use display name as a key.
- Soft archive hides exercises from default selectors; history and old sessions keep resolving by slug.
- Hard delete only when never referenced (routines, sessions/sets, PRs). Otherwise archive.
- Recording types: `strength | bodyweight | timed | cardio` (mapped to workout `Weight | Repetitions | Time | Cardio`).
- Images: path association only (`/public/exercises` or none → placeholder). No binary blobs in localStorage.
- Structural recording-type changes with history warn the user; full exercise versioning deferred.
- Routine editor / template versioning: see Decision 018.

Reason

Product must own the catalog without Cursor edits, while protecting historical workouts (Decision 005).

---

## Decision 018

Routines are managed local entities with immutable versions (`traza:v1:routines` + `traza:v1:routine_versions`).

Rules

- A routine is a living training program (identity), not a disposable exercise list.
- Status is only `active` | `archived`. Active appear in Entrenar; archived do not. Restore = activate.
- Seed routines (Día A / B / C / Casa) merge idempotently like exercises: missing slugs inserted; user edits never overwritten. Seed version ids stay `${slug}:v1` so existing sessions keep resolving.
- Session `templateId` = routine `slug`. Session `templateVersionId` = stable version `id`. History never rewrites.
- Plan resolution for a session prefers `templateVersionId` (Decision 001 / 005).
- Minor edits (name, description, goal, estimated duration, notes) update in place — no new version, no save dialog.
- Structural edits (add/remove/reorder exercises, sets, rep ranges, rest, RIR, load increment override): in-place if no completed sessions; if history exists, UI asks Update this routine vs Create new version (versioning stays; visible vN is hidden in daily UX).
- Duplicate copies selectable parts (exercises / configuration / rests / notes) into a new routine with a fresh version lineage (starts at v1).
- Constructor overrides are routine-local only; library exercises are never edited from here. Add exercises from active library only.
- Architecture hooks only (not shipped): block kind / pair group / tempo, future DnD reorder API, AI / sharing flags.
- Superseries, dropsets, giant sets, tempo UI, per-set notes, AI, and sharing are out of scope for Phase 7.2.

Reason

Own the training program in-product without Cursor, while guaranteeing historical sessions always point at the version that was trained.

---

## Decision 019

Local data center under Más → Datos e informes. Backups and exports are first-class product surfaces; data stays on-device in this phase.

Rules

- Export UX: Period → Format → Export (content checkboxes, all on by default). Periods: 7d / 30d / 90d / current year / all / custom.
- Formats: CSV (ZIP of domain CSVs), Excel (one workbook + Resumen), PDF (TRAZA-styled report), JSON (full backup).
- JSON backup is the only restore format. Payload always includes `schemaVersion` and `appVersion`. Future imports migrate via `schemaVersion` (`migrateBackupPayload`).
- Restore never auto-applies: show summary → Replace / Merge / Cancel. Merge unions by id; on conflict newer `updatedAt` wins; ids are never rewritten.
- Derived analytics/insights/PRs are optional in the JSON for sharing; restore ignores them and recomputes from raw stores.
- No Google Drive / Dropbox / iCloud / Supabase / cloud sync / AI in this phase. The JSON document is cloud-prep: the same portable unit can upload later without reshaping domains.
- Architecture: `features/data/*` (exporters, importers, schema, storage stats) outside React; UI under `/more/data/*`. AnalyticsService / InsightsService are consumed read-only.
- Meta: `traza:v1:data_meta` for last backup/export stamps.

Reason

Treat user data as an asset users can backup, analyze, share (e.g. with ChatGPT), and restore — with a stable schema that survives TRAZA upgrades.
