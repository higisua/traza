export type TrackingType = "Weight" | "Repetitions" | "Time" | "Cardio";

export type ExerciseCatalogItem = {
  slug: string;
  name: string;
  nameEs: string;
  image: string;
  trackingType: TrackingType;
  defaultSets: number;
  defaultRepRange: { min: number; max: number } | null;
  defaultRestSeconds: number;
  defaultRir: { min: number; max: number } | null;
  /** Suggested starting load (kg) when no prior set exists. */
  defaultLoad: number | null;
};

export type RoutineExercisePlan = {
  exerciseSlug: string;
  order: number;
  sets: number;
  repRange: { min: number; max: number } | null;
  rir: { min: number; max: number } | null;
  restSeconds: number;
  durationMinutes: number | null;
  durationSeconds: number | null;
  pair: string | null;
};

export type RoutineCatalogItem = {
  slug: string;
  name: string;
  nameEs: string;
  description: string;
  estimatedDurationMinutes: number;
  exerciseCount: number;
  coverImage: string;
  exercises: RoutineExercisePlan[];
};

export type SetDraft = {
  load: string;
  repetitions: string;
  durationSeconds: string;
  rir: number | null;
};

export type SessionSummaryStats = {
  durationMinutes: number;
  setsCompleted: number;
  volumeKg: number;
  exercisesCompleted: number;
  exerciseTotal: number;
};

export type RestState = {
  exerciseIndex: number;
  setNumber: number;
  totalSeconds: number;
  endsAt: number;
  pausedRemainingMs: number | null;
};

/** Snapshot of a logged set used for anticipation context. */
export type SetSnapshot = {
  load: number | null;
  repetitions: number | null;
  durationSeconds: number | null;
  rir: number | null;
};

export type ExerciseLogContext = {
  lastSession: SetSnapshot | null;
  priorSet: SetSnapshot | null;
};

export type RestNextContext = {
  kind: "same_exercise" | "next_exercise";
  exerciseName: string;
  setNumber: number;
  plannedSets: number;
};

/** Visual / nav state for an exercise in the active session. */
export type ExerciseNavState = "completed" | "partial" | "active" | "pending";

export type RoutineLastSessionSummary = {
  sessionDate: string;
  volumeKg: number;
};

/** Outcome after logging a set — drives UI animation + navigation. */
export type LogSetOutcome =
  | { kind: "edit_saved" }
  | {
      kind: "logged";
      sessionComplete: boolean;
      sameExerciseContinues: boolean;
      restSeconds: number;
      nextExerciseIndex: number | null;
    };
