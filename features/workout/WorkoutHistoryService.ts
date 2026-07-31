import type { WorkoutSet } from "@/lib/storage/trainingStorage";
import { WorkoutCatalog } from "./WorkoutCatalog";
import { WorkoutRepository } from "./WorkoutRepository";
import { PRService } from "./PRService";
import { exerciseVolumeKg, setVolumeKg } from "./VolumeService";
import type {
  ExerciseHistorySession,
  ExerciseHistorySetRow,
  ExerciseHistorySummary,
  PersonalRecordKind,
} from "./WorkoutTypes";

function toHistorySetRow(
  set: WorkoutSet,
  prKinds: PersonalRecordKind[],
): ExerciseHistorySetRow {
  return {
    setId: set.id,
    setNumber: set.setNumber,
    load: set.load,
    repetitions: set.repetitions,
    durationSeconds: set.durationSeconds,
    rir: set.rir ?? null,
    volumeKg: setVolumeKg(set),
    prKinds,
  };
}

/**
 * Session / set history for a single exercise.
 * Reusable by the history screen, in-session sheet, and later Progress tab.
 */
export const WorkoutHistoryService = {
  /**
   * All finished sessions that include this exercise, newest first.
   * Each row lists every set with volume + PR flags.
   */
  getExerciseHistory(exerciseId: string): ExerciseHistorySession[] {
    const sessions = WorkoutRepository.getSessions()
      .filter(
        (session) =>
          session.status !== "cancelled" &&
          session.status !== "in_progress",
      )
      .sort((a, b) => {
        const byDate = b.sessionDate.localeCompare(a.sessionDate);
        if (byDate !== 0) return byDate;
        return b.updatedAt.localeCompare(a.updatedAt);
      });

    const rows: ExerciseHistorySession[] = [];

    for (const session of sessions) {
      const match = session.exercises.find(
        (item) => item.exerciseId === exerciseId,
      );
      if (!match || match.sets.length === 0) continue;

      const routineNameEs = session.templateId
        ? (WorkoutCatalog.getRoutine(session.templateId)?.nameEs ?? null)
        : null;

      const sets = match.sets.map((set) => {
        // A set is marked PR when it is the standing record for that kind.
        const standing = PRService.getRecords(exerciseId);
        const kinds = standing
          .filter((record) => record.setId === set.id)
          .map((record) => record.kind);
        return toHistorySetRow(set, kinds);
      });

      rows.push({
        sessionId: session.id,
        sessionDate: session.sessionDate,
        routineSlug: session.templateId,
        routineNameEs,
        volumeKg: exerciseVolumeKg(match),
        sets,
      });
    }

    return rows;
  },

  /** Compact recent slice for the in-session bottom sheet. */
  getRecentExerciseHistory(
    exerciseId: string,
    limit = 5,
  ): ExerciseHistorySession[] {
    return this.getExerciseHistory(exerciseId).slice(0, limit);
  },

  /** Simple top-line stats — no charts. */
  getExerciseSummary(exerciseId: string): ExerciseHistorySummary {
    const history = this.getExerciseHistory(exerciseId);
    const records = PRService.getRecords(exerciseId);

    let bestLoad: number | null = null;
    let bestReps: number | null = null;
    let bestSetVolume: number | null = null;
    let totalVolumeKg = 0;

    for (const session of history) {
      totalVolumeKg += session.volumeKg;
      for (const set of session.sets) {
        if (set.load != null && (bestLoad == null || set.load > bestLoad)) {
          bestLoad = set.load;
        }
        if (
          set.repetitions != null &&
          (bestReps == null || set.repetitions > bestReps)
        ) {
          bestReps = set.repetitions;
        }
        if (
          set.volumeKg > 0 &&
          (bestSetVolume == null || set.volumeKg > bestSetVolume)
        ) {
          bestSetVolume = set.volumeKg;
        }
      }
    }

    return {
      exerciseId,
      sessionCount: history.length,
      totalVolumeKg,
      bestLoad,
      bestReps,
      bestSetVolume,
      records,
      lastSessionDate: history[0]?.sessionDate ?? null,
    };
  },
};
