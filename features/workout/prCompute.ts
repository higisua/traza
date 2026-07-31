/**
 * Pure personal-record computation over workout sessions.
 * Shared by Analytics (snapshot) and PRService (in-session evaluation).
 */

import type {
  WorkoutSession,
  WorkoutSet,
} from "@/lib/storage/trainingStorage";
import { setVolumeKg } from "./VolumeService";
import type { PersonalRecordKind, PersonalRecordResult } from "./WorkoutTypes";

export type NamedSet = {
  set: WorkoutSet;
  sessionId: string;
  sessionDate: string;
};

export function isFinishedSession(session: WorkoutSession): boolean {
  return session.status !== "cancelled" && session.status !== "in_progress";
}

export function collectExerciseSetsFromSessions(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string | null,
): NamedSet[] {
  const out: NamedSet[] = [];
  for (const session of sessions) {
    if (excludeSessionId && session.id === excludeSessionId) continue;
    if (!isFinishedSession(session)) continue;
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

export function bestLoad(sets: readonly NamedSet[]): NamedSet | null {
  let best: NamedSet | null = null;
  for (const item of sets) {
    if (item.set.load == null) continue;
    if (!best || (best.set.load ?? -1) < item.set.load) {
      best = item;
    }
  }
  return best;
}

export function bestReps(sets: readonly NamedSet[]): NamedSet | null {
  let best: NamedSet | null = null;
  for (const item of sets) {
    if (item.set.repetitions == null) continue;
    if (!best || (best.set.repetitions ?? -1) < item.set.repetitions) {
      best = item;
    }
  }
  return best;
}

export function bestVolume(sets: readonly NamedSet[]): NamedSet | null {
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

export function toPersonalRecord(
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
 * Current all-time PRs for one exercise from a session list.
 */
export function computeExerciseRecords(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
  excludeSessionId?: string | null,
): PersonalRecordResult[] {
  const sets = collectExerciseSetsFromSessions(
    sessions,
    exerciseId,
    excludeSessionId,
  );
  const records: PersonalRecordResult[] = [];
  const load = bestLoad(sets);
  const reps = bestReps(sets);
  const volume = bestVolume(sets);
  if (load) records.push(toPersonalRecord("max_load", load));
  if (reps) records.push(toPersonalRecord("max_reps", reps));
  if (volume) records.push(toPersonalRecord("max_volume", volume));
  return records;
}

/**
 * Which PR kinds `set` would set vs prior history in `sessions`.
 */
export function evaluateSetRecords(
  sessions: readonly WorkoutSession[],
  exerciseId: string,
  set: WorkoutSet,
  options?: { excludeSessionId?: string | null },
): PersonalRecordKind[] {
  const prior = collectExerciseSetsFromSessions(
    sessions,
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
}

/**
 * Distinct exercise IDs that appear in finished/partial sessions.
 */
export function collectExerciseIds(
  sessions: readonly WorkoutSession[],
): string[] {
  const ids = new Set<string>();
  for (const session of sessions) {
    if (!isFinishedSession(session)) continue;
    for (const exercise of session.exercises) {
      ids.add(exercise.exerciseId);
    }
  }
  return Array.from(ids).sort((a, b) => a.localeCompare(b));
}
