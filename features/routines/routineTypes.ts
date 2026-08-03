/**
 * Manageable routine catalog — identity + immutable versions.
 * Gold rule: routines change over time; history never does.
 * Sessions store templateId === routine.slug and templateVersionId === version.id.
 */

export type RoutineStatus = "active" | "archived";

/**
 * Architecture hooks for future advanced set structures.
 * Not exposed in MVP UI — persisted as defaults only.
 */
export type RoutineBlockKind =
  | "single"
  | "superset"
  | "dropset"
  | "giant";

/** One exercise block inside a routine version (constructor unit). */
export type RoutineBlock = {
  /** Stable within a version — enables reorder / duplicate without remount thrash. */
  id: string;
  exerciseSlug: string;
  order: number;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  rirMin: number | null;
  rirMax: number | null;
  restSeconds: number;
  durationMinutes: number | null;
  durationSeconds: number | null;
  /** Routine-local comment — does not edit the library exercise. */
  comment: string | null;
  /**
   * Optional routine-local load increment override (kg).
   * Null = use library exercise default. Not applied in session baking yet.
   */
  loadIncrementOverride: number | null;
  /**
   * Prep for supersets / paired blocks (seed pairs preserved).
   * UI does not edit this in Phase 7.2 — no superseries controls.
   */
  pairGroup: string | null;
  /** Prep — always "single" in MVP. Future block grouping hook. */
  blockKind: RoutineBlockKind;
  /** Prep — tempo notation; unused in MVP. */
  tempo: string | null;
  /**
   * Prep — optional parent block id for grouped structures (supersets).
   * Unused in Phase 7.2 UI.
   */
  groupId: string | null;
};

/** Immutable snapshot of structure at a point in time. */
export type RoutineVersion = {
  /** Stable id — historical sessions point here forever. */
  id: string;
  routineId: string;
  versionNumber: number;
  blocks: RoutineBlock[];
  estimatedDurationMinutes: number;
  exerciseCount: number;
  createdAt: string;
};

/** Product defaults applied when adding a new block (each block can override). */
export const DEFAULT_ROUTINE_REST_SECONDS = 90;
export const DEFAULT_ROUTINE_TARGET_RIR = 2;

/** Living routine identity — descriptive fields may change without new version. */
export type Routine = {
  /** Entity id. Seed routines use slug as id. */
  id: string;
  /** Stable historical key — session templateId stores slug. Never rename after use. */
  slug: string;
  name: string;
  nameEs: string;
  description: string;
  /** Training objective / goal. */
  goal: string | null;
  /**
   * Default rest (seconds) for newly added blocks.
   * Block.restSeconds can override. Not baked into sessions yet.
   */
  defaultRestSeconds: number;
  /**
   * Default target RIR for newly added blocks.
   * Block rirMin/rirMax can override. Not baked into sessions yet.
   */
  defaultTargetRir: number;
  status: RoutineStatus;
  currentVersionId: string;
  currentVersionNumber: number;
  isSeed: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Routine + current version for editor / list presentation. */
export type RoutineWithVersion = {
  routine: Routine;
  version: RoutineVersion;
};

export type RoutineBlockInput = {
  exerciseSlug: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  rirMin: number | null;
  rirMax: number | null;
  restSeconds: number;
  durationMinutes?: number | null;
  durationSeconds?: number | null;
  comment?: string | null;
  loadIncrementOverride?: number | null;
  pairGroup?: string | null;
  blockKind?: RoutineBlockKind;
  tempo?: string | null;
  groupId?: string | null;
  /** Preserve id when editing in place. */
  id?: string;
};

/** What to copy when duplicating a living routine. Defaults: all on. */
export type RoutineDuplicateOptions = {
  exercises: boolean;
  configuration: boolean;
  rests: boolean;
  notes: boolean;
};

export const DEFAULT_ROUTINE_DUPLICATE_OPTIONS: RoutineDuplicateOptions = {
  exercises: true,
  configuration: true,
  rests: true,
  notes: true,
};

/** How to persist a structural edit when history exists. */
export type RoutineVersionSaveMode = "inplace" | "new_version";

export type RoutineUpdateOptions = {
  /** When set, overrides auto decision for structural+history saves. */
  versionMode?: RoutineVersionSaveMode;
};

/** Living-program metrics for detail (omit empties in UI). */
export type RoutineLivingStats = {
  completedSessions: number;
  lastSessionDate: string | null;
  averageDurationMinutes: number | null;
  averageVolumeKg: number | null;
};

/** Compact finished-session row for routine detail history. */
export type RoutineRecentSession = {
  sessionId: string;
  sessionDate: string;
  durationMinutes: number | null;
};

export type RoutineInput = {
  name: string;
  nameEs?: string;
  description?: string;
  goal?: string | null;
  estimatedDurationMinutes: number;
  blocks: RoutineBlockInput[];
  /** Optional slug override (create only). */
  slug?: string;
  defaultRestSeconds?: number;
  defaultTargetRir?: number;
};

export type RoutineFieldErrors = {
  name?: string;
  description?: string;
  goal?: string;
  estimatedDurationMinutes?: string;
  blocks?: string;
  structural?: string;
};

export type RoutineValidationResult =
  | { ok: true; value: RoutineInput }
  | { ok: false; errors: RoutineFieldErrors };

export type RoutineFilters = {
  query?: string;
  status?: RoutineStatus | "all";
};

export type RoutineReferenceSummary = {
  completedSessions: number;
  inProgressSessions: number;
  totalSessions: number;
  hasCompletedHistory: boolean;
  canHardDelete: boolean;
};

export type VersionDecision =
  | {
      action: "inplace";
      reason: "descriptive_only" | "no_completed_history" | "user_overwrite";
    }
  | { action: "new_version"; reason: "structural_with_history" | "user_new_version" };

/**
 * Prep surface for future AI / sharing — not implemented.
 * Call sites can depend on this shape without shipping features.
 */
export type RoutineFutureHooks = {
  aiAssistEnabled: false;
  sharingEnabled: false;
  advancedSetsEnabled: false;
};

export const ROUTINE_FUTURE_HOOKS: RoutineFutureHooks = {
  aiAssistEnabled: false,
  sharingEnabled: false,
  advancedSetsEnabled: false,
};
