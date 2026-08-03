/**
 * Manageable exercise catalog — single source of truth for seed + user exercises.
 * Historical identity is always `slug` (sessions store exerciseId === slug).
 */

/** Product recording types (UI + persistence). */
export type RecordingType = "strength" | "bodyweight" | "timed" | "cardio";

/** Legacy workout TrackingType — kept for session logging compatibility. */
export type TrackingType = "Weight" | "Repetitions" | "Time" | "Cardio";

export type ExerciseStatus = "active" | "archived";

export type LoadType =
  | "Total Weight"
  | "Per Dumbbell"
  | "Per Side"
  | "Bodyweight"
  | "N/A"
  | "Assistance";

export type LoadUnit = "kg" | "lb";

/** Allowed load increment steps (kg). */
export const LOAD_INCREMENTS = [
  0.5, 1, 1.25, 2, 2.5, 5, 10,
] as const;

export type LoadIncrement = (typeof LOAD_INCREMENTS)[number];

export type ExerciseDefaults = {
  sets: number;
  repMin: number | null;
  repMax: number | null;
  targetRir: number | null;
  restSeconds: number;
  loadIncrement: LoadIncrement;
  initialLoad: number | null;
  loadUnit: LoadUnit;
};

export type Exercise = {
  /** Stable entity id. Seed exercises use slug as id. */
  id: string;
  /** Stable historical key — NEVER rename once used in history. */
  slug: string;
  name: string;
  /** Spanish display name (may match name for gym-English labels). */
  nameEs: string;
  status: ExerciseStatus;
  recordingType: RecordingType;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string | null;
  equipment: string | null;
  loadType: LoadType;
  /** Body zone / group hint — mirrors primary muscle family when useful. */
  bodyZone: string | null;
  defaults: ExerciseDefaults;
  /** Public path under /exercises, or null for placeholder. */
  imagePath: string | null;
  techniqueTip: string | null;
  setupNote: string | null;
  isBilateral: boolean;
  isSeed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ExerciseInput = {
  name: string;
  nameEs?: string;
  recordingType: RecordingType;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  movementPattern?: string | null;
  equipment?: string | null;
  loadType?: LoadType;
  bodyZone?: string | null;
  defaults: ExerciseDefaults;
  imagePath?: string | null;
  techniqueTip?: string | null;
  setupNote?: string | null;
  isBilateral?: boolean;
  /** Optional slug override (create only). Auto-generated when omitted. */
  slug?: string;
};

export type ExerciseFieldErrors = {
  name?: string;
  slug?: string;
  recordingType?: string;
  primaryMuscle?: string;
  sets?: string;
  repMin?: string;
  repMax?: string;
  targetRir?: string;
  restSeconds?: string;
  loadIncrement?: string;
  initialLoad?: string;
  structural?: string;
};

export type ExerciseValidationResult =
  | { ok: true; value: ExerciseInput }
  | { ok: false; errors: ExerciseFieldErrors };

export type ExerciseFilters = {
  query?: string;
  status?: ExerciseStatus | "all";
  recordingType?: RecordingType | "all";
  primaryMuscle?: string | "all";
};

export type ExerciseReferenceSummary = {
  usedInRoutines: number;
  usedInWorkoutSessions: number;
  workoutSets: number;
  personalRecords: number;
  canDelete: boolean;
};

export type StructuralChangeWarning = {
  hasHistory: boolean;
  fromType: RecordingType;
  toType: RecordingType;
  message: string;
};
