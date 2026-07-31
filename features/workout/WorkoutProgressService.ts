import type { WorkoutSet } from "@/lib/storage/trainingStorage";
import { WorkoutCatalog } from "./WorkoutCatalog";
import { WorkoutRepository } from "./WorkoutRepository";
import { formatLoadDisplay } from "./WorkoutFormat";
import type {
  SetDraft,
  SetSnapshot,
  SuggestedTarget,
  SuggestedTargetReason,
} from "./WorkoutTypes";

/**
 * WorkoutProgressService — suggested target for today
 * ==================================================
 *
 * Transparent, rule-based progression. No AI.
 * Goal: answer “what should I try today?” without clutter.
 *
 * Rules (evaluated in order on the last finished set for the exercise):
 *
 * 1. Time / Cardio exercises → no suggestion (duration stays as-is).
 * 2. No prior finished set → no suggestion (catalog / defaults preload).
 * 3. RIR === 0 → KEEP load & reps
 *    (true failure / grind — do not push further).
 * 4. Reps at or above the top of the planned/catalog rep range:
 *    - RIR ≥ 2 → INCREASE_LOAD by a small step, reset reps to range min
 *      (or keep reps if no range). Load step: +2.5 kg when load ≥ 20,
 *      otherwise +1 kg.
 *    - RIR 0–1 → KEEP (already handled for 0; at 1 stay put).
 * 5. RIR ≥ 3 → ADD_REP (+1 rep, same load)
 *    (plenty in reserve — add a rep before chasing load).
 * 6. RIR === 2 and reps < range max → ADD_REP
 *    (comfortable set with room in the range — product default path,
 *    e.g. 52,5 × 9 RIR 2 → 52,5 × 10).
 * 7. Otherwise → KEEP (RIR 1 mid-range, missing RIR, etc.).
 *
 * Draft preload policy (WorkoutService.draftForSet):
 * - Always preload previous in-session set, else last finished session
 *   (same weight / reps / RIR). Never auto-apply the suggested target.
 * - Suggested target is display-only in the log context UI; the user
 *   may follow it manually.
 */

function toSnapshot(set: WorkoutSet): SetSnapshot {
  return {
    load: set.load,
    repetitions: set.repetitions,
    durationSeconds: set.durationSeconds,
    rir: set.rir ?? null,
  };
}

/** Most recent finished set for an exercise (last set of newest session). */
function findLastFinishedSet(exerciseId: string): WorkoutSet | null {
  const sessions = WorkoutRepository.getSessions();
  for (const prior of sessions) {
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

function loadStepKg(load: number): number {
  return load >= 20 ? 2.5 : 1;
}

function resolveRepRange(
  exerciseId: string,
  routineSlug: string | null,
): { min: number; max: number } | null {
  if (routineSlug) {
    const routine = WorkoutCatalog.getRoutine(routineSlug);
    const plan = routine?.exercises.find(
      (item) => item.exerciseSlug === exerciseId,
    );
    if (plan?.repRange) return plan.repRange;
  }
  const catalog = WorkoutCatalog.getExercise(exerciseId);
  return catalog?.defaultRepRange ?? null;
}

function buildTarget(
  load: number | null,
  repetitions: number | null,
  rir: number | null,
  reason: SuggestedTargetReason,
): SuggestedTarget {
  return {
    load,
    repetitions,
    durationSeconds: null,
    rir,
    reason,
  };
}

export const WorkoutProgressService = {
  /** Last finished performance snapshot for an exercise, if any. */
  getLastPerformance(exerciseId: string): SetSnapshot | null {
    const set = findLastFinishedSet(exerciseId);
    return set ? toSnapshot(set) : null;
  },

  /**
   * Suggested target for the next working set of this exercise.
   * `routineSlug` improves rep-range resolution (plan over catalog).
   */
  getSuggestedTarget(
    exerciseId: string,
    routineSlug: string | null = null,
  ): SuggestedTarget | null {
    const catalog = WorkoutCatalog.getExercise(exerciseId);
    if (!catalog) return null;
    if (catalog.trackingType === "Time" || catalog.trackingType === "Cardio") {
      return null;
    }

    const last = findLastFinishedSet(exerciseId);
    if (!last) return null;

    const load = last.load;
    const reps = last.repetitions;
    const rir = last.rir ?? null;
    const range = resolveRepRange(exerciseId, routineSlug);

    // Rule 3 — grind / failure
    if (rir === 0) {
      return buildTarget(load, reps, rir, "keep");
    }

    // Rule 4 — top of range
    if (
      reps != null &&
      range != null &&
      reps >= range.max
    ) {
      if (rir != null && rir >= 2 && load != null) {
        const nextLoad = Number((load + loadStepKg(load)).toFixed(1));
        return buildTarget(nextLoad, range.min, rir, "increase_load");
      }
      return buildTarget(load, reps, rir, "keep");
    }

    // Rule 5 — high reserve
    if (rir != null && rir >= 3 && reps != null) {
      return buildTarget(load, reps + 1, rir, "add_rep");
    }

    // Rule 6 — comfortable with room in range
    if (
      rir === 2 &&
      reps != null &&
      (range == null || reps < range.max)
    ) {
      return buildTarget(load, reps + 1, rir, "add_rep");
    }

    // Rule 7 — default
    return buildTarget(load, reps, rir, "keep");
  },

  /** Compact line: "52,5 × 10" or "12 reps" / duration. */
  formatTargetCompact(target: SuggestedTarget): string {
    if (target.durationSeconds != null) {
      return `${target.durationSeconds} s`;
    }
    if (target.load != null && target.repetitions != null) {
      return `${formatLoadDisplay(target.load)} × ${target.repetitions}`;
    }
    if (target.repetitions != null) {
      return `${target.repetitions} reps`;
    }
    if (target.load != null) {
      return `${formatLoadDisplay(target.load)} kg`;
    }
    return "—";
  },

  /** Apply suggestion into a draft (manual follow — not used for preload). */
  applyToDraft(target: SuggestedTarget, base: SetDraft): SetDraft {
    return {
      load:
        target.load != null ? formatLoadDisplay(target.load) : base.load,
      repetitions:
        target.repetitions != null
          ? String(target.repetitions)
          : base.repetitions,
      durationSeconds:
        target.durationSeconds != null
          ? String(target.durationSeconds)
          : base.durationSeconds,
      rir: target.rir ?? base.rir,
    };
  },

  /** True when suggestion differs from last performance (worth showing). */
  differsFromLast(
    target: SuggestedTarget,
    last: SetSnapshot | null,
  ): boolean {
    if (!last) return true;
    return (
      target.load !== last.load ||
      target.repetitions !== last.repetitions ||
      target.durationSeconds !== last.durationSeconds
    );
  },
};
