import { trainingStorage } from "@/lib/storage/trainingStorage";
import { WorkoutCatalog } from "@/features/workout/WorkoutCatalog";
import { PRService } from "@/features/workout/PRService";
import type { ExerciseReferenceSummary } from "./exerciseTypes";

/**
 * Summarize where an exercise slug is referenced.
 * Safe-delete is only allowed when nothing references it.
 *
 * Prepared for future: routine version history storage will also count here.
 */
export function getExerciseReferences(
  slug: string,
): ExerciseReferenceSummary {
  const routines = WorkoutCatalog.listRoutines().filter((routine) =>
    routine.exercises.some((plan) => plan.exerciseSlug === slug),
  );

  // Future: persisted templates / template versions
  const templates = trainingStorage.getTemplates();
  const templateHits = templates.filter((template) => {
    // Templates today only store metadata; exercise membership lives in catalog.
    // Keep hook so routine persistence can extend without API change.
    void template;
    return false;
  }).length;

  const sessions = trainingStorage.getSessions();
  let usedInWorkoutSessions = 0;
  let workoutSets = 0;

  for (const session of sessions) {
    const match = session.exercises.find((ex) => ex.exerciseId === slug);
    if (!match) continue;
    usedInWorkoutSessions += 1;
    workoutSets += match.sets.length;
  }

  const personalRecords = PRService.getRecords(slug).length;
  const usedInRoutines = routines.length + templateHits;

  const canDelete =
    usedInRoutines === 0 &&
    usedInWorkoutSessions === 0 &&
    workoutSets === 0 &&
    personalRecords === 0;

  return {
    usedInRoutines,
    usedInWorkoutSessions,
    workoutSets,
    personalRecords,
    canDelete,
  };
}

export function canDeleteExercise(slug: string): boolean {
  return getExerciseReferences(slug).canDelete;
}
