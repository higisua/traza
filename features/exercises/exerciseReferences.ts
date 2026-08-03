import { trainingStorage } from "@/lib/storage/trainingStorage";
import { RoutineRepository } from "@/features/routines/routineRepository";
import { PRService } from "@/features/workout/PRService";
import type { ExerciseReferenceSummary } from "./exerciseTypes";

/**
 * Summarize where an exercise slug is referenced.
 * Safe-delete is only allowed when nothing references it.
 */
export function getExerciseReferences(
  slug: string,
): ExerciseReferenceSummary {
  const versions = RoutineRepository.getAllVersions();
  const routineHits = new Set<string>();
  for (const version of versions) {
    if (version.blocks.some((block) => block.exerciseSlug === slug)) {
      routineHits.add(version.routineId);
    }
  }

  // Legacy stub templates (unused by Phase 7.2 managed catalog)
  const templates = trainingStorage.getTemplates();
  const templateHits = templates.filter((template) => {
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
  const usedInRoutines = routineHits.size + templateHits;

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
