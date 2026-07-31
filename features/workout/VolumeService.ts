import type {
  WorkoutSession,
  WorkoutSessionExercise,
  WorkoutSet,
} from "@/lib/storage/trainingStorage";
import { WorkoutRepository } from "./WorkoutRepository";

/** Volume of a single set: load × reps (0 when either is missing). */
export function setVolumeKg(set: WorkoutSet): number {
  if (set.load == null || set.repetitions == null) return 0;
  return set.load * set.repetitions;
}

/** Sum of set volumes for one exercise block in a session. */
export function exerciseVolumeKg(exercise: WorkoutSessionExercise): number {
  return exercise.sets.reduce((sum, set) => sum + setVolumeKg(set), 0);
}

/** Total session volume across all exercises. */
export function sessionVolumeKg(session: WorkoutSession): number {
  return session.exercises.reduce(
    (sum, exercise) => sum + exerciseVolumeKg(exercise),
    0,
  );
}

/**
 * Volume helpers for workout intelligence and Progress-tab reuse.
 * Pure computation — no UI assumptions.
 */
export const VolumeService = {
  setVolumeKg,
  exerciseVolumeKg,
  sessionVolumeKg,

  /** Volume for one exercise across a single finished/partial session. */
  volumeForExerciseInSession(
    session: WorkoutSession,
    exerciseId: string,
  ): number {
    const match = session.exercises.find(
      (item) => item.exerciseId === exerciseId,
    );
    return match ? exerciseVolumeKg(match) : 0;
  },

  /**
   * Aggregate volume for an exercise across all finished sessions
   * (excludes cancelled / in-progress).
   */
  totalVolumeForExercise(exerciseId: string): number {
    return WorkoutRepository.getSessions().reduce((sum, session) => {
      if (session.status === "cancelled" || session.status === "in_progress") {
        return sum;
      }
      return sum + this.volumeForExerciseInSession(session, exerciseId);
    }, 0);
  },

  /**
   * Aggregate volume for a routine template across finished sessions.
   * Prepared for Progress tab — not shown on a dedicated volume screen.
   */
  totalVolumeForRoutine(routineSlug: string): number {
    return WorkoutRepository.getSessions().reduce((sum, session) => {
      if (session.templateId !== routineSlug) return sum;
      if (session.status === "cancelled" || session.status === "in_progress") {
        return sum;
      }
      return sum + sessionVolumeKg(session);
    }, 0);
  },
};
