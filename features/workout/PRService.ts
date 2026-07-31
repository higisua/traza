import type {
  WorkoutSession,
  WorkoutSet,
} from "@/lib/storage/trainingStorage";
import { WorkoutRepository } from "./WorkoutRepository";
import { setVolumeKg } from "./VolumeService";
import type { PersonalRecordKind, PersonalRecordResult } from "./WorkoutTypes";

type NamedSet = {
  set: WorkoutSet;
  sessionId: string;
  sessionDate: string;
};

function finishedSessions(
  excludeSessionId?: string | null,
): WorkoutSession[] {
  return WorkoutRepository.getSessions().filter((session) => {
    if (excludeSessionId && session.id === excludeSessionId) return false;
    if (session.status === "cancelled" || session.status === "in_progress") {
      return false;
    }
    return true;
  });
}

function collectExerciseSets(
  exerciseId: string,
  excludeSessionId?: string | null,
): NamedSet[] {
  const out: NamedSet[] = [];
  for (const session of finishedSessions(excludeSessionId)) {
    const match = session.exercises.find(
      (item) => item.exerciseId === exerciseId,
    );
    if (!match) continue;
    for (const set of match.sets) {
      out.push({
        set,
        sessionId: session.id,
        sessionDate: session.sessionDate,
      });
    }
  }
  return out;
}

function bestLoad(sets: NamedSet[]): NamedSet | null {
  let best: NamedSet | null = null;
  for (const item of sets) {
    if (item.set.load == null) continue;
    if (!best || (best.set.load ?? -1) < item.set.load) {
      best = item;
    }
  }
  return best;
}

function bestReps(sets: NamedSet[]): NamedSet | null {
  let best: NamedSet | null = null;
  for (const item of sets) {
    if (item.set.repetitions == null) continue;
    if (!best || (best.set.repetitions ?? -1) < item.set.repetitions) {
      best = item;
    }
  }
  return best;
}

function bestVolume(sets: NamedSet[]): NamedSet | null {
  let best: NamedSet | null = null;
  let bestVol = -1;
  for (const item of sets) {
    const vol = setVolumeKg(item.set);
    if (vol <= 0) continue;
    if (vol > bestVol) {
      bestVol = vol;
      best = item;
    }
  }
  return best;
}

function toRecord(
  kind: PersonalRecordKind,
  item: NamedSet,
): PersonalRecordResult {
  return {
    kind,
    setId: item.set.id,
    sessionId: item.sessionId,
    sessionDate: item.sessionDate,
    load: item.set.load,
    repetitions: item.set.repetitions,
    volumeKg: setVolumeKg(item.set),
  };
}

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
 */
export const PRService = {
  getRecords(
    exerciseId: string,
    excludeSessionId?: string | null,
  ): PersonalRecordResult[] {
    const sets = collectExerciseSets(exerciseId, excludeSessionId);
    const records: PersonalRecordResult[] = [];
    const load = bestLoad(sets);
    const reps = bestReps(sets);
    const volume = bestVolume(sets);
    if (load) records.push(toRecord("max_load", load));
    if (reps) records.push(toRecord("max_reps", reps));
    if (volume) records.push(toRecord("max_volume", volume));
    return records;
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
    const prior = collectExerciseSets(
      exerciseId,
      options?.excludeSessionId,
    );
    const kinds: PersonalRecordKind[] = [];

    if (set.load != null) {
      const prev = bestLoad(prior);
      if (!prev || set.load > (prev.set.load ?? -1)) {
        kinds.push("max_load");
      }
    }

    if (set.repetitions != null) {
      const prev = bestReps(prior);
      if (!prev || set.repetitions > (prev.set.repetitions ?? -1)) {
        kinds.push("max_reps");
      }
    }

    const vol = setVolumeKg(set);
    if (vol > 0) {
      const prev = bestVolume(prior);
      const prevVol = prev ? setVolumeKg(prev.set) : 0;
      if (vol > prevVol) {
        kinds.push("max_volume");
      }
    }

    return kinds;
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
