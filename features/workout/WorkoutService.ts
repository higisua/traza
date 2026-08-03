import { createId } from "@/lib/storage/localStorage";
import type {
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet,
} from "@/lib/storage/trainingStorage";
import { RoutineRepository } from "@/features/routines/routineRepository";
import { PRService } from "./PRService";
import { WorkoutCatalog } from "./WorkoutCatalog";
import {
  computeSessionStats,
  formatLoadDisplay,
  parseDraftNumber,
  todaySessionDate,
} from "./WorkoutFormat";
import { WorkoutProgressService } from "./WorkoutProgressService";
import { WorkoutRepository } from "./WorkoutRepository";
import type {
  ExerciseLogContext,
  ExerciseNavState,
  PersonalRecordKind,
  RestNextContext,
  RestState,
  RoutineLastSessionSummary,
  SetDraft,
  SetSnapshot,
} from "./WorkoutTypes";

function cloneSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({ ...set })),
    })),
  };
}

type SessionRoutineRef = {
  templateId: string | null;
  templateVersionId: string | null;
};

function plannedSetsFor(
  session: SessionRoutineRef,
  exerciseSlug: string,
): number {
  const routine = WorkoutCatalog.getRoutineForSession(session);
  const plan = routine?.exercises.find(
    (item) => item.exerciseSlug === exerciseSlug,
  );
  return plan?.sets ?? 1;
}

function restSecondsFor(
  session: SessionRoutineRef,
  exerciseSlug: string,
): number {
  const routine = WorkoutCatalog.getRoutineForSession(session);
  const plan = routine?.exercises.find(
    (item) => item.exerciseSlug === exerciseSlug,
  );
  return plan?.restSeconds ?? 90;
}

function toSnapshot(set: WorkoutSet): SetSnapshot {
  return {
    load: set.load,
    repetitions: set.repetitions,
    durationSeconds: set.durationSeconds,
    rir: set.rir ?? null,
  };
}

/** Most recent set for an exercise across prior finished sessions. */
function findPriorSessionSet(
  session: WorkoutSession,
  exerciseId: string,
): WorkoutSet | null {
  const sessions = WorkoutRepository.getSessions();
  for (const prior of sessions) {
    if (prior.id === session.id) continue;
    if (prior.status === "cancelled" || prior.status === "in_progress") {
      continue;
    }
    const match = prior.exercises.find(
      (item) => item.exerciseId === exerciseId,
    );
    if (!match || match.sets.length === 0) continue;
    return match.sets[match.sets.length - 1] ?? null;
  }
  return null;
}

/** Prefer current-session last set, then prior sessions, then catalog default. */
function suggestedLoadKg(
  session: WorkoutSession,
  exerciseId: string,
  lastSetLoad: number | null | undefined,
  catalogDefault: number | null | undefined,
): number | null {
  if (lastSetLoad != null) return lastSetLoad;

  const prior = findPriorSessionSet(session, exerciseId);
  if (prior?.load != null) return prior.load;

  return catalogDefault ?? null;
}

function updateExerciseStatus(
  exercise: WorkoutSessionExercise,
  plannedSets: number,
): WorkoutSessionExercise {
  if (exercise.sets.length === 0) {
    return { ...exercise, status: "pending" };
  }
  if (exercise.sets.length >= plannedSets) {
    return { ...exercise, status: "completed" };
  }
  return { ...exercise, status: "partial" };
}

export const WorkoutService = {
  startSession(routineSlug: string): WorkoutSession | null {
    // Only active managed routines appear in Entrenar; archived are blocked.
    const managed = RoutineRepository.getBySlug(routineSlug);
    if (managed && managed.status !== "active") return null;

    const versionId = managed?.currentVersionId ?? null;
    const routine = WorkoutCatalog.getRoutine(routineSlug, versionId);
    if (!routine) return null;

    const existing = WorkoutRepository.getActiveSession();
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const exercises: WorkoutSessionExercise[] = routine.exercises.map(
      (plan, index) => ({
        id: createId(),
        exerciseId: plan.exerciseSlug,
        plannedOrder: plan.order,
        performedOrder: index + 1,
        status: "pending",
        lastSetRir: null,
        notes: null,
        sets: [],
      }),
    );

    return WorkoutRepository.createSession({
      templateId: routine.slug,
      templateVersionId:
        versionId ?? `${routine.slug}:v1`,
      sessionDate: todaySessionDate(),
      startTime: now,
      endTime: null,
      durationMinutes: null,
      status: "in_progress",
      exercises,
    });
  },

  getSession(sessionId: string): WorkoutSession | null {
    return WorkoutRepository.getSessionById(sessionId);
  },

  getActiveSession(): WorkoutSession | null {
    return WorkoutRepository.getActiveSession();
  },

  draftForSet(
    session: WorkoutSession,
    exerciseIndex: number,
  ): SetDraft {
    const exercise = session.exercises[exerciseIndex];
    const catalog = exercise
      ? WorkoutCatalog.getExercise(exercise.exerciseId)
      : null;
    const routine = WorkoutCatalog.getRoutineForSession(session);
    const plan = routine?.exercises.find(
      (item) => item.exerciseSlug === exercise?.exerciseId,
    );

    const lastSet = exercise?.sets[exercise.sets.length - 1] ?? null;

    // Preload from previous in-session set, else last finished session —
    // never from the suggested target (shown in context UI only).
    const priorSet =
      exercise && !lastSet
        ? findPriorSessionSet(session, exercise.exerciseId)
        : null;
    const suggestedReps =
      lastSet?.repetitions ??
      priorSet?.repetitions ??
      plan?.repRange?.max ??
      catalog?.defaultRepRange?.max ??
      10;
    const suggestedRir =
      lastSet?.rir ??
      priorSet?.rir ??
      exercise?.lastSetRir ??
      plan?.rir?.max ??
      catalog?.defaultRir?.max ??
      2;
    const suggestedDuration =
      lastSet?.durationSeconds ??
      priorSet?.durationSeconds ??
      plan?.durationSeconds ??
      (plan?.durationMinutes ? plan.durationMinutes * 60 : null) ??
      30;

    if (catalog?.trackingType === "Time" || catalog?.trackingType === "Cardio") {
      return {
        load: "",
        repetitions: "",
        durationSeconds: String(suggestedDuration),
        rir: null,
      };
    }

    if (catalog?.trackingType === "Repetitions") {
      return {
        load: "",
        repetitions: String(suggestedReps),
        durationSeconds: "",
        rir: suggestedRir,
      };
    }

    const loadKg = suggestedLoadKg(
      session,
      exercise!.exerciseId,
      lastSet?.load,
      catalog?.defaultLoad,
    );

    return {
      load: loadKg != null ? formatLoadDisplay(loadKg) : "",
      repetitions: String(suggestedReps),
      durationSeconds: "",
      rir: suggestedRir,
    };
  },

  validateDraft(
    session: WorkoutSession,
    exerciseIndex: number,
    draft: SetDraft,
  ): string | null {
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) return "Ejercicio no encontrado";
    const catalog = WorkoutCatalog.getExercise(exercise.exerciseId);
    if (!catalog) return "Ejercicio no encontrado";

    if (catalog.trackingType === "Time" || catalog.trackingType === "Cardio") {
      const duration = parseDraftNumber(draft.durationSeconds);
      if (duration == null || duration <= 0) {
        return "Indica la duración";
      }
      return null;
    }

    const reps = parseDraftNumber(draft.repetitions);
    if (reps == null || reps <= 0) return "Indica las repeticiones";

    if (catalog.trackingType === "Weight") {
      const load = parseDraftNumber(draft.load);
      if (load == null || load < 0) return "Indica la carga";
    }

    return null;
  },

  logSet(
    sessionId: string,
    exerciseIndex: number,
    draft: SetDraft,
  ): {
    session: WorkoutSession;
    restSeconds: number;
    prKinds: PersonalRecordKind[];
  } | null {
    const current = WorkoutRepository.getSessionById(sessionId);
    if (!current || current.status !== "in_progress") return null;

    const error = this.validateDraft(current, exerciseIndex, draft);
    if (error) return null;

    const session = cloneSession(current);
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) return null;

    const catalog = WorkoutCatalog.getExercise(exercise.exerciseId);
    if (!catalog) return null;

    const plannedSets = plannedSetsFor(session, exercise.exerciseId);
    const setNumber = exercise.sets.length + 1;

    const nextSet: WorkoutSet = {
      id: createId(),
      setNumber,
      load: null,
      repetitions: null,
      durationSeconds: null,
      rir: null,
      createdAt: new Date().toISOString(),
    };

    if (catalog.trackingType === "Time" || catalog.trackingType === "Cardio") {
      nextSet.durationSeconds = parseDraftNumber(draft.durationSeconds);
    } else if (catalog.trackingType === "Repetitions") {
      nextSet.repetitions = parseDraftNumber(draft.repetitions);
      nextSet.rir = draft.rir;
    } else {
      nextSet.load = parseDraftNumber(draft.load);
      nextSet.repetitions = parseDraftNumber(draft.repetitions);
      nextSet.rir = draft.rir;
    }

    const prKinds = PRService.evaluateSet(exercise.exerciseId, nextSet, {
      excludeSessionId: sessionId,
    });

    exercise.sets = [...exercise.sets, nextSet];
    if (draft.rir != null) {
      exercise.lastSetRir = draft.rir;
    }
    session.exercises[exerciseIndex] = updateExerciseStatus(
      exercise,
      plannedSets,
    );

    const saved = WorkoutRepository.saveSession(session);
    const restSeconds = restSecondsFor(session, exercise.exerciseId);

    return { session: saved, restSeconds, prKinds };
  },

  updateLastSet(
    sessionId: string,
    exerciseIndex: number,
    draft: SetDraft,
  ): { session: WorkoutSession; prKinds: PersonalRecordKind[] } | null {
    const current = WorkoutRepository.getSessionById(sessionId);
    if (!current || current.status !== "in_progress") return null;

    const error = this.validateDraft(current, exerciseIndex, draft);
    if (error) return null;

    const session = cloneSession(current);
    const exercise = session.exercises[exerciseIndex];
    if (!exercise || exercise.sets.length === 0) return null;

    const catalog = WorkoutCatalog.getExercise(exercise.exerciseId);
    if (!catalog) return null;

    const last = exercise.sets[exercise.sets.length - 1]!;
    if (catalog.trackingType === "Time" || catalog.trackingType === "Cardio") {
      last.durationSeconds = parseDraftNumber(draft.durationSeconds);
      last.load = null;
      last.repetitions = null;
      last.rir = null;
    } else if (catalog.trackingType === "Repetitions") {
      last.repetitions = parseDraftNumber(draft.repetitions);
      last.load = null;
      last.durationSeconds = null;
      last.rir = draft.rir;
    } else {
      last.load = parseDraftNumber(draft.load);
      last.repetitions = parseDraftNumber(draft.repetitions);
      last.durationSeconds = null;
      last.rir = draft.rir;
    }

    if (draft.rir != null) {
      exercise.lastSetRir = draft.rir;
    }

    const plannedSets = plannedSetsFor(session, exercise.exerciseId);
    session.exercises[exerciseIndex] = updateExerciseStatus(
      exercise,
      plannedSets,
    );

    const prKinds = PRService.evaluateSet(exercise.exerciseId, last, {
      excludeSessionId: sessionId,
    });

    return {
      session: WorkoutRepository.saveSession(session),
      prKinds,
    };
  },

  markExerciseComplete(
    sessionId: string,
    exerciseIndex: number,
  ): WorkoutSession | null {
    const current = WorkoutRepository.getSessionById(sessionId);
    if (!current || current.status !== "in_progress") return null;
    const session = cloneSession(current);
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) return null;
    exercise.status =
      exercise.sets.length > 0 ? "completed" : "skipped";
    session.exercises[exerciseIndex] = exercise;
    return WorkoutRepository.saveSession(session);
  },

  finishSession(sessionId: string): WorkoutSession | null {
    const current = WorkoutRepository.getSessionById(sessionId);
    if (!current) return null;
    if (current.status === "completed") return current;

    const session = cloneSession(current);
    const now = new Date().toISOString();
    session.endTime = now;
    session.status = "completed";

    session.exercises = session.exercises.map((exercise) => {
      if (exercise.sets.length === 0) {
        return { ...exercise, status: "skipped" };
      }
      const planned = plannedSetsFor(session, exercise.exerciseId);
      return updateExerciseStatus(exercise, planned);
    });

    const stats = computeSessionStats({ ...session, endTime: now });
    session.durationMinutes = stats.durationMinutes;

    return WorkoutRepository.saveSession(session);
  },

  plannedSets(session: WorkoutSession, exerciseIndex: number): number {
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) return 1;
    return plannedSetsFor(session, exercise.exerciseId);
  },

  restSeconds(session: WorkoutSession, exerciseIndex: number): number {
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) return 90;
    return restSecondsFor(session, exercise.exerciseId);
  },

  isExerciseComplete(session: WorkoutSession, exerciseIndex: number): boolean {
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) return true;
    if (exercise.status === "completed" || exercise.status === "skipped") {
      return true;
    }
    const planned = plannedSetsFor(session, exercise.exerciseId);
    return exercise.sets.length >= planned;
  },

  /** First exercise with pending work (session order). */
  firstOpenExerciseIndex(session: WorkoutSession): number {
    const incomplete = session.exercises.findIndex((_, index) =>
      !this.isExerciseComplete(session, index),
    );
    return incomplete >= 0
      ? incomplete
      : Math.max(0, session.exercises.length - 1);
  },

  /**
   * Next pending exercise strictly after `fromIndex`.
   * Skips completed work so auto-advance never forces re-logging.
   */
  nextPendingExerciseIndex(
    session: WorkoutSession,
    fromIndex: number,
  ): number | null {
    for (let i = fromIndex + 1; i < session.exercises.length; i += 1) {
      if (!this.isExerciseComplete(session, i)) return i;
    }
    return null;
  },

  /** Alias used by the session cursor model. */
  nextPendingTarget(
    session: WorkoutSession,
    fromIndex: number,
  ): number | null {
    return this.nextPendingExerciseIndex(session, fromIndex);
  },

  exerciseNavState(
    session: WorkoutSession,
    exerciseIndex: number,
    activeExerciseIndex: number,
  ): ExerciseNavState {
    if (exerciseIndex === activeExerciseIndex) return "active";
    if (this.isExerciseComplete(session, exerciseIndex)) return "completed";
    const exercise = session.exercises[exerciseIndex];
    if (exercise && exercise.sets.length > 0) return "partial";
    return "pending";
  },

  sessionProgress(
    session: WorkoutSession,
    activeExerciseIndex?: number,
  ): {
    setsDone: number;
    setsTotal: number;
    exercises: { done: number; total: number; state: ExerciseNavState }[];
  } {
    let setsDone = 0;
    let setsTotal = 0;
    const active =
      activeExerciseIndex ?? this.firstOpenExerciseIndex(session);
    const exercises = session.exercises.map((exercise, index) => {
      const total = plannedSetsFor(session, exercise.exerciseId);
      const done = Math.min(exercise.sets.length, total);
      setsDone += done;
      setsTotal += total;
      return {
        done,
        total,
        state: this.exerciseNavState(session, index, active),
      };
    });
    return { setsDone, setsTotal, exercises };
  },

  isSessionWorkComplete(session: WorkoutSession): boolean {
    return session.exercises.every((_, index) =>
      this.isExerciseComplete(session, index),
    );
  },

  /** Latest finished session date for a routine slug, if any. */
  getLastRoutineSessionDate(routineSlug: string): string | null {
    return this.getLastRoutineSessionSummary(routineSlug)?.sessionDate ?? null;
  },

  /** Last finished session date + volume for pre-summary context. */
  getLastRoutineSessionSummary(
    routineSlug: string,
  ): RoutineLastSessionSummary | null {
    const sessions = WorkoutRepository.getSessions();
    for (const session of sessions) {
      if (session.templateId !== routineSlug) continue;
      if (session.status === "cancelled" || session.status === "in_progress") {
        continue;
      }
      const stats = computeSessionStats(session);
      return {
        sessionDate: session.sessionDate,
        volumeKg: stats.volumeKg,
      };
    }
    return null;
  },

  /** Anticipation context above the logging form. */
  getExerciseLogContext(
    session: WorkoutSession,
    exerciseIndex: number,
  ): ExerciseLogContext {
    const exercise = session.exercises[exerciseIndex];
    if (!exercise) {
      return { lastSession: null, priorSet: null, suggestedTarget: null };
    }

    const priorInSession =
      exercise.sets.length > 0
        ? toSnapshot(exercise.sets[exercise.sets.length - 1]!)
        : null;
    const lastSessionSet = findPriorSessionSet(session, exercise.exerciseId);
    const suggestedTarget = WorkoutProgressService.getSuggestedTarget(
      exercise.exerciseId,
      session.templateId,
    );

    return {
      lastSession: lastSessionSet ? toSnapshot(lastSessionSet) : null,
      priorSet: priorInSession,
      suggestedTarget,
    };
  },

  /** What comes after the current rest — same exercise or next pending. */
  getRestNextContext(
    session: WorkoutSession,
    rest: RestState,
  ): RestNextContext | null {
    const current = session.exercises[rest.exerciseIndex];
    if (!current) return null;

    const planned = plannedSetsFor(session, current.exerciseId);
    const completed = current.sets.length;
    const sameExerciseNext = completed < planned;

    if (sameExerciseNext) {
      const catalog = WorkoutCatalog.getExercise(current.exerciseId);
      return {
        kind: "same_exercise",
        exerciseName: catalog?.nameEs ?? "Ejercicio",
        setNumber: completed + 1,
        plannedSets: planned,
      };
    }

    const nextIndex = this.nextPendingExerciseIndex(
      session,
      rest.exerciseIndex,
    );
    if (nextIndex == null) return null;
    const next = session.exercises[nextIndex];
    if (!next) return null;
    const nextCatalog = WorkoutCatalog.getExercise(next.exerciseId);
    const nextPlanned = plannedSetsFor(session, next.exerciseId);
    return {
      kind: "next_exercise",
      exerciseName: nextCatalog?.nameEs ?? "Ejercicio",
      setNumber: Math.min(next.sets.length + 1, nextPlanned),
      plannedSets: nextPlanned,
    };
  },
};
