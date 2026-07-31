import type {
  WorkoutSession,
  WorkoutSet,
} from "@/lib/storage/trainingStorage";
import { WorkoutRepository } from "./WorkoutRepository";
import {
  computeExerciseRecords,
  evaluateSetRecords,
} from "./prCompute";
import type { PersonalRecordKind, PersonalRecordResult } from "./WorkoutTypes";

/**
 * Detects personal records for an exercise.
 *
 * Kinds (independent — a set can be more than one):
 * - max_load: heaviest load ever logged
 * - max_reps: most repetitions in a single set
 * - max_volume: highest load × reps in a single set
 *
 * Compares against finished sessions only. When evaluating a live set,
 * pass `excludeSessionId` so the current in-progress session is not
 * counted twice as history.
 *
 * Pure computation lives in `prCompute.ts` (also used by Analytics).
 */
export const PRService = {
  getRecords(
    exerciseId: string,
    excludeSessionId?: string | null,
  ): PersonalRecordResult[] {
    return computeExerciseRecords(
      WorkoutRepository.getSessions(),
      exerciseId,
      excludeSessionId,
    );
  },

  /**
   * Which PR kinds this set would (or does) set, vs prior history.
   * Empty array = not a PR.
   */
  evaluateSet(
    exerciseId: string,
    set: WorkoutSet,
    options?: { excludeSessionId?: string | null },
  ): PersonalRecordKind[] {
    return evaluateSetRecords(
      WorkoutRepository.getSessions(),
      exerciseId,
      set,
      options,
    );
  },

  /** True when the set is any kind of PR vs prior history. */
  isPersonalRecord(
    exerciseId: string,
    set: WorkoutSet,
    options?: { excludeSessionId?: string | null },
  ): boolean {
    return this.evaluateSet(exerciseId, set, options).length > 0;
  },

  /** Spanish label for a PR kind — short, for subtle UI chips. */
  labelEs(kind: PersonalRecordKind): string {
    switch (kind) {
      case "max_load":
        return "PR carga";
      case "max_reps":
        return "PR reps";
      case "max_volume":
        return "PR volumen";
      default:
        return "PR";
    }
  },
};
