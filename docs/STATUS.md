# PROJECT STATUS

Version: 0.5.0  
Last Updated: 2026-08-03

---

# Current Status

Phase:  
🟢 Phase 0 — Foundation (Done)  
🟢 Phase 1 — Tracking (Done)  
🟢 Training / sessions / calendar / analytics / insights / progress (shipped on Phase 1 foundation)  
🟡 Phase 7.1 — Exercise management (awaiting approval)  
🟡 Phase 7.2 — Routine management (awaiting approval)  
🟡 Phase 8 — Datos e informes (awaiting approval)

Status:  
Managed catalogs + local data center (export / backup / restore / storage info). No commit/push until product approval.

---

# Current Sprint

Phase 8 – Datos e informes

Goal:

Make local data a first-class asset: export (CSV ZIP / Excel / PDF), full JSON backup with `schemaVersion`, restore (replace / merge / cancel), and storage info — under Más → Datos e informes. Local only; no cloud.

---

# Completed

## Phase 0 — Foundation

✅ Product documentation  
✅ Design System docs  
✅ PLAN.md approved (with Decisions 006–011)  
✅ Next.js + TypeScript + Tailwind  
✅ Design tokens integration  
✅ Framer Motion motion system  
✅ Core component library  
✅ App shell + Bottom Navigation  
✅ `/dev/components` gallery  
✅ `lib/storage` localStorage modules  
✅ Design elevation passes  
✅ Home redesign as tracking-status hub (Decision 012)  
✅ Home visual premium pass (Decision 013 — training as mode entry)  
✅ Home art direction pass (Decision 014 — composition, asymmetry, purposeful lime)  
✅ Home «Instrumento» system v2 — desirability / premium materials (Decision 016)  

## Phase 1 — Tracking

✅ Home  
✅ Weight  
✅ Blood Pressure  
✅ Sleep  
✅ Steps  
✅ Body Measurements  
✅ Tracking Module Kit completed  

## Training & beyond (differential)

✅ Workout routines / session logging  
✅ Calendar  
✅ Analytics / Insights  
✅ Progress  

## Phase 7.1 — Exercise management (implemented, pending approval)

✅ `features/exercises` domain (repository / service / hooks / references / images)  
✅ Idempotent seed of 29 exercises into `traza:v1:exercises`  
✅ WorkoutCatalog delegates live exercise lookups to repository  
✅ Más → Gestión de entrenamiento → Ejercicios  
✅ List / detail / create / edit / archive / restore / safe-delete  
✅ Decision 017 + DATABASE / STATUS updates  

## Phase 7.2 — Routine management (implemented, pending approval)

✅ `features/routines` domain (types / seed / repository / versioning / service / hooks / references)  
✅ Idempotent seed of 4 routines + `${slug}:v1` versions into `traza:v1:routines` + `traza:v1:routine_versions`  
✅ WorkoutCatalog lists active managed routines; session plan resolution prefers `templateVersionId`  
✅ Más → Gestión de entrenamiento → Rutinas (library / constructor / detail / preview)  
✅ Duplicate / archive / restore / auto-version on structural edits with history  
✅ Decision 018 + DATABASE / STATUS updates  

## Phase 8 — Datos e informes (implemented, pending approval)

✅ `features/data` (schema / period / collect / CSV·Excel·PDF·JSON exporters / restore / storage stats)  
✅ Más → Datos e informes hub + export / restore / storage screens  
✅ CSV ZIP, Excel (+ Resumen), PDF report, JSON full backup (`schemaVersion: 1`)  
✅ Restore preview → Replace / Merge / Cancel  
✅ Decision 019 + DATABASE / STATUS updates  
✅ Libraries: jszip, exceljs, jspdf (client dynamic import)

---

# In Progress

🟡 Phase 7.1 + 7.2 + 8 awaiting product approval (no commit/push)

---

# Pending

⬜ Cloud sync / Supabase  
⬜ Polish / V1 release  
⬜ Future: superseries / dropsets / DnD / AI / sharing (hooks only today)

---

# Current Priority

Approve Phase 7–8 surfaces, then continue product iteration.

---

# Current Branch

main (uncommitted Phase 7.1 + 7.2 + 8 work)

---

# Known Issues

Image binaries are not stored in localStorage — only catalog paths + placeholder (see Decision 017).

---

# Decisions

See `docs/DECISIONS.md` (through 019).
