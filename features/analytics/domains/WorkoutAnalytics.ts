import { differenceInCalendarDays, parseISO } from "date-fns";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";
import { sessionVolumeKg } from "@/features/workout/VolumeService";
import { WorkoutCatalog } from "@/features/workout/WorkoutCatalog";
import {
  collectExerciseIds,
  computeExerciseRecords,
} from "@/features/workout/prCompute";
import { addCalendarDays, mean } from "../core";
import type {
  ExercisePersonalRecords,
  MostPerformedExercise,
  WorkoutAnalyticsResult,
} from "../types";

function isCountableSession(session: WorkoutSession): boolean {
  return session.status === "completed" || session.status === "partial";
}

/**
 * Workout aggregates from finished/partial sessions only.
 * Includes all-time personal records per exercise (from pure prCompute).
 */
export function analyzeWorkouts(
  sessions: readonly WorkoutSession[],
  asOfDate?: string,
): WorkoutAnalyticsResult {
  const countable = sessions.filter(isCountableSession);
  const asOf =
    asOfDate ??
    countable[0]?.sessionDate ??
    new Date().toLocaleDateString("en-CA");
  const weekStart = addCalendarDays(asOf, -6);

  let totalVolumeKg = 0;
  let weeklyVolumeKg = 0;
  let totalSets = 0;
  const durations: number[] = [];
  const exerciseSessions = new Map<string, number>();
  const exerciseSets = new Map<string, number>();

  for (const session of countable) {
    const volume = sessionVolumeKg(session);
    totalVolumeKg += volume;
    if (session.sessionDate >= weekStart && session.sessionDate <= asOf) {
      weeklyVolumeKg += volume;
    }

    if (
      session.durationMinutes != null &&
      Number.isFinite(session.durationMinutes)
    ) {
      durations.push(session.durationMinutes);
    }

    for (const exercise of session.exercises) {
      const setCount = exercise.sets.length;
      totalSets += setCount;
      exerciseSessions.set(
        exercise.exerciseId,
        (exerciseSessions.get(exercise.exerciseId) ?? 0) + 1,
      );
      exerciseSets.set(
        exercise.exerciseId,
        (exerciseSets.get(exercise.exerciseId) ?? 0) + setCount,
      );
    }
  }

  const workoutsPerWeek = computeWorkoutsPerWeek(countable);
  const mostPerformedExercise = pickMostPerformed(
    exerciseSessions,
    exerciseSets,
  );

  return {
    totalWorkouts: countable.length,
    workoutsPerWeek,
    meanDurationMinutes: mean(durations),
    totalVolumeKg,
    weeklyVolumeKg,
    totalSets,
    distinctExercises: exerciseSessions.size,
    mostPerformedExercise,
    personalRecords: computeAllPersonalRecords(sessions),
  };
}

function computeAllPersonalRecords(
  sessions: readonly WorkoutSession[],
): ExercisePersonalRecords[] {
  const out: ExercisePersonalRecords[] = [];
  for (const exerciseId of collectExerciseIds(sessions)) {
    const records = computeExerciseRecords(sessions, exerciseId);
    if (records.length === 0) continue;
    const catalog = WorkoutCatalog.getExercise(exerciseId);
    out.push({
      exerciseId,
      nameEs: catalog?.nameEs ?? exerciseId,
      records,
    });
  }
  return out;
}

function computeWorkoutsPerWeek(
  sessions: readonly WorkoutSession[],
): number | null {
  if (sessions.length === 0) return null;
  const dates = sessions.map((s) => s.sessionDate).sort();
  const first = dates[0];
  const last = dates[dates.length - 1];
  const spanDays =
    Math.max(1, differenceInCalendarDays(parseISO(last), parseISO(first)) + 1);
  const weeks = spanDays / 7;
  return sessions.length / weeks;
}

function pickMostPerformed(
  sessionCounts: Map<string, number>,
  setCounts: Map<string, number>,
): MostPerformedExercise | null {
  if (sessionCounts.size === 0) return null;

  let bestId = "";
  let bestSessions = -1;
  let bestSets = -1;

  for (const [id, sessions] of sessionCounts) {
    const sets = setCounts.get(id) ?? 0;
    if (
      sessions > bestSessions ||
      (sessions === bestSessions && sets > bestSets) ||
      (sessions === bestSessions &&
        sets === bestSets &&
        id.localeCompare(bestId) < 0)
    ) {
      bestId = id;
      bestSessions = sessions;
      bestSets = sets;
    }
  }

  const catalog = WorkoutCatalog.getExercise(bestId);
  return {
    exerciseId: bestId,
    nameEs: catalog?.nameEs ?? bestId,
    sessionCount: bestSessions,
    setCount: bestSets,
  };
}
