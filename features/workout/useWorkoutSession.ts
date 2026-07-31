"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { storageKey } from "@/lib/storage/localStorage";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";
import { formatLoadDisplay } from "./WorkoutFormat";
import { WorkoutService } from "./WorkoutService";
import type { LogSetOutcome, RestState, SetDraft } from "./WorkoutTypes";

const SESSIONS_KEY = storageKey("workout_sessions");

let activeCache: WorkoutSession | null = null;
let activeCacheRaw = "";
const sessionCache = new Map<
  string,
  { raw: string; session: WorkoutSession | null }
>();

function readActiveSession(): WorkoutSession | null {
  const session = WorkoutService.getActiveSession();
  const raw = session ? JSON.stringify(session) : "";
  if (raw === activeCacheRaw) return activeCache;
  activeCacheRaw = raw;
  activeCache = session;
  return activeCache;
}

function readSessionById(sessionId: string): WorkoutSession | null {
  const session = WorkoutService.getSession(sessionId);
  const raw = session ? JSON.stringify(session) : "";
  const cached = sessionCache.get(sessionId);
  if (cached && cached.raw === raw) return cached.session;
  const next = { raw, session };
  sessionCache.set(sessionId, next);
  return session;
}

function invalidateCaches(): void {
  activeCacheRaw = "";
  activeCache = null;
  sessionCache.clear();
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const notify = () => {
    invalidateCaches();
    onStoreChange();
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSIONS_KEY || event.key === null) {
      notify();
    }
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener("traza:workout-sessions", notify);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("traza:workout-sessions", notify);
  };
}

function bump(): void {
  if (typeof window === "undefined") return;
  invalidateCaches();
  window.dispatchEvent(new Event("traza:workout-sessions"));
}

function emptyDraft(): SetDraft {
  return {
    load: "",
    repetitions: "",
    durationSeconds: "",
    rir: 2,
  };
}

/**
 * Stable SSR + first client paint. Prefer useEffect over
 * useSyncExternalStore(true/false): getSnapshot≠getServerSnapshot can
 * still surface as a hydration mismatch in some React/Next paths.
 */
function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

export function useActiveWorkoutSession() {
  const hydrated = useHydrated();
  const session = useSyncExternalStore(
    subscribe,
    readActiveSession,
    () => null,
  );

  return { session: hydrated ? session : null, hydrated };
}

/**
 * Session cursor model
 * --------------------
 * `activeExerciseIndex` — exercise the athlete is viewing / logging.
 * `nextPendingTarget`   — first incomplete exercise in session order
 *                         (the training partner’s “what’s next”).
 *
 * Browse freely with chevrons (machine busy → jump ahead).
 * Auto-advance after register/rest always resolves to next pending work,
 * never re-opens a completed exercise to force re-logging.
 */
export function useWorkoutSession(sessionId: string) {
  const hydrated = useHydrated();
  const session = useSyncExternalStore(
    subscribe,
    () => readSessionById(sessionId),
    () => null,
  );

  const [navIndex, setNavIndex] = useState<number | null>(null);
  const [navSessionId, setNavSessionId] = useState<string | null>(null);
  const [draftOverride, setDraftOverride] = useState<SetDraft | null>(null);
  const [editingLast, setEditingLast] = useState(false);
  const [rest, setRest] = useState<RestState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);

  const activeExerciseIndex =
    navSessionId === sessionId && navIndex != null
      ? navIndex
      : session
        ? WorkoutService.firstOpenExerciseIndex(session)
        : 0;

  const nextPendingTarget = session
    ? (() => {
        if (!WorkoutService.isExerciseComplete(session, activeExerciseIndex)) {
          return activeExerciseIndex;
        }
        return (
          WorkoutService.nextPendingTarget(session, activeExerciseIndex) ??
          WorkoutService.firstOpenExerciseIndex(session)
        );
      })()
    : 0;

  const baseDraft =
    session != null
      ? WorkoutService.draftForSet(session, activeExerciseIndex)
      : emptyDraft();
  const draft = draftOverride ?? baseDraft;

  const setDraft = useCallback((next: SetDraft) => {
    setDraftOverride(next);
  }, []);

  const plantCursor = useCallback(
    (index: number) => {
      if (!session) return;
      const clamped = Math.max(0, Math.min(index, session.exercises.length - 1));
      setNavSessionId(sessionId);
      setNavIndex(clamped);
      setDraftOverride(null);
      setEditingLast(false);
      setError(null);
      setJustLogged(false);
    },
    [session, sessionId],
  );

  /** Free browse — any exercise, including completed / ahead. */
  const goToExercise = useCallback(
    (index: number) => {
      plantCursor(index);
    },
    [plantCursor],
  );

  /**
   * Forward continue — always land on next pending work.
   * If current still has sets, stay; else jump past completed ones.
   */
  const goToNextPending = useCallback(() => {
    if (!session) return;
    if (!WorkoutService.isExerciseComplete(session, activeExerciseIndex)) {
      plantCursor(activeExerciseIndex);
      return;
    }
    const next = WorkoutService.nextPendingTarget(
      session,
      activeExerciseIndex,
    );
    if (next != null) {
      plantCursor(next);
      return;
    }
    const first = WorkoutService.firstOpenExerciseIndex(session);
    plantCursor(first);
  }, [session, activeExerciseIndex, plantCursor]);

  const advanceAfterExercise = useCallback(
    (fromIndex: number, liveSession: WorkoutSession) => {
      if (WorkoutService.isSessionWorkComplete(liveSession)) {
        return { sessionComplete: true as const, nextIndex: null };
      }
      const next = WorkoutService.nextPendingTarget(liveSession, fromIndex);
      if (next != null) {
        setNavSessionId(sessionId);
        setNavIndex(next);
        return { sessionComplete: false as const, nextIndex: next };
      }
      const first = WorkoutService.firstOpenExerciseIndex(liveSession);
      setNavSessionId(sessionId);
      setNavIndex(first);
      return { sessionComplete: false as const, nextIndex: first };
    },
    [sessionId],
  );

  const logSet = useCallback((): LogSetOutcome | null => {
    if (!session) return null;
    const validation = WorkoutService.validateDraft(
      session,
      activeExerciseIndex,
      draft,
    );
    if (validation) {
      setError(validation);
      return null;
    }

    if (editingLast) {
      const updated = WorkoutService.updateLastSet(
        sessionId,
        activeExerciseIndex,
        draft,
      );
      bump();
      if (!updated) {
        setError("No se pudo guardar");
        return null;
      }
      setEditingLast(false);
      setError(null);
      setDraftOverride(null);
      return { kind: "edit_saved" };
    }

    // Guard: never append sets to an already-complete exercise.
    if (WorkoutService.isExerciseComplete(session, activeExerciseIndex)) {
      setError(null);
      goToNextPending();
      return null;
    }

    const result = WorkoutService.logSet(
      sessionId,
      activeExerciseIndex,
      draft,
    );
    if (!result) {
      setError("No se pudo registrar la serie");
      return null;
    }
    bump();
    setError(null);
    setDraftOverride(null);
    setJustLogged(true);

    const planned = WorkoutService.plannedSets(
      result.session,
      activeExerciseIndex,
    );
    const completedSets =
      result.session.exercises[activeExerciseIndex]?.sets.length ?? 0;
    const exerciseDone = completedSets >= planned;
    const sessionComplete = WorkoutService.isSessionWorkComplete(
      result.session,
    );

    if (sessionComplete) {
      // Last pending set of the session — closing flow, no rest choice.
      return {
        kind: "logged",
        sessionComplete: true,
        sameExerciseContinues: false,
        restSeconds: 0,
        nextExerciseIndex: null,
      };
    }

    if (!exerciseDone) {
      // More sets on this exercise → rest, then show next set prefilled.
      if (result.restSeconds > 0) {
        setRest({
          exerciseIndex: activeExerciseIndex,
          setNumber: completedSets,
          totalSeconds: result.restSeconds,
          endsAt: Date.now() + result.restSeconds * 1000,
          pausedRemainingMs: null,
        });
      }
      return {
        kind: "logged",
        sessionComplete: false,
        sameExerciseContinues: true,
        restSeconds: result.restSeconds,
        nextExerciseIndex: activeExerciseIndex,
      };
    }

    // Exercise finished — rest then jump to next pending (skip completed).
    const advanced = advanceAfterExercise(
      activeExerciseIndex,
      result.session,
    );
    if (result.restSeconds > 0) {
      setRest({
        exerciseIndex: activeExerciseIndex,
        setNumber: completedSets,
        totalSeconds: result.restSeconds,
        endsAt: Date.now() + result.restSeconds * 1000,
        pausedRemainingMs: null,
      });
    }

    return {
      kind: "logged",
      sessionComplete: false,
      sameExerciseContinues: false,
      restSeconds: result.restSeconds,
      nextExerciseIndex: advanced.nextIndex,
    };
  }, [
    session,
    sessionId,
    activeExerciseIndex,
    draft,
    editingLast,
    advanceAfterExercise,
    goToNextPending,
  ]);

  const clearJustLogged = useCallback(() => {
    setJustLogged(false);
  }, []);

  const completeRest = useCallback(() => {
    setRest((current) => {
      if (!current || !session) return null;
      const live = readSessionById(sessionId) ?? session;
      const planned = WorkoutService.plannedSets(
        live,
        current.exerciseIndex,
      );
      const completed =
        live.exercises[current.exerciseIndex]?.sets.length ?? 0;

      if (completed >= planned) {
        // Land on next pending — never the next index if already done.
        const next = WorkoutService.nextPendingTarget(
          live,
          current.exerciseIndex,
        );
        if (next != null) {
          setNavSessionId(sessionId);
          setNavIndex(next);
        } else if (!WorkoutService.isSessionWorkComplete(live)) {
          setNavSessionId(sessionId);
          setNavIndex(WorkoutService.firstOpenExerciseIndex(live));
        }
      }
      // Same exercise continues: stay on current index; draft rebuilds.
      setDraftOverride(null);
      setJustLogged(false);
      return null;
    });
  }, [session, sessionId]);

  const skipRest = useCallback(() => {
    completeRest();
  }, [completeRest]);

  const pauseRest = useCallback(() => {
    setRest((current) => {
      if (!current || current.pausedRemainingMs != null) return current;
      return {
        ...current,
        pausedRemainingMs: Math.max(0, current.endsAt - Date.now()),
      };
    });
  }, []);

  const resumeRest = useCallback(() => {
    setRest((current) => {
      if (!current || current.pausedRemainingMs == null) return current;
      return {
        ...current,
        endsAt: Date.now() + current.pausedRemainingMs,
        pausedRemainingMs: null,
      };
    });
  }, []);

  const beginEditLast = useCallback(() => {
    if (!session) return;
    const exercise = session.exercises[activeExerciseIndex];
    const last = exercise?.sets[exercise.sets.length - 1];
    if (!last) return;
    setDraftOverride({
      load: last.load != null ? formatLoadDisplay(last.load) : "",
      repetitions: last.repetitions != null ? String(last.repetitions) : "",
      durationSeconds:
        last.durationSeconds != null ? String(last.durationSeconds) : "",
      rir: last.rir ?? exercise.lastSetRir,
    });
    setEditingLast(true);
    setError(null);
  }, [session, activeExerciseIndex]);

  const cancelEdit = useCallback(() => {
    setEditingLast(false);
    setDraftOverride(null);
    setError(null);
  }, []);

  const finish = useCallback(() => {
    const done = WorkoutService.finishSession(sessionId);
    bump();
    return done;
  }, [sessionId]);

  return {
    session: hydrated ? session : null,
    hydrated,
    /** @deprecated use activeExerciseIndex — kept for call-site compatibility */
    exerciseIndex: activeExerciseIndex,
    activeExerciseIndex,
    nextPendingTarget,
    draft,
    setDraft,
    error,
    rest,
    editingLast,
    justLogged,
    clearJustLogged,
    goToExercise,
    goToNextPending,
    logSet,
    skipRest,
    completeRest,
    pauseRest,
    resumeRest,
    beginEditLast,
    cancelEdit,
    finish,
    setRest,
  };
}
