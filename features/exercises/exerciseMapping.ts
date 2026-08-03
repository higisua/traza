import type { ExerciseCatalogItem, TrackingType } from "@/features/workout/WorkoutTypes";
import type { Exercise, RecordingType } from "./exerciseTypes";

/** Inline to avoid circular imports with WorkoutCatalog bootstrap. */
const PLACEHOLDER = "/exercises/_placeholder.svg";

export function recordingTypeToTracking(type: RecordingType): TrackingType {
  switch (type) {
    case "strength":
      return "Weight";
    case "bodyweight":
      return "Repetitions";
    case "timed":
      return "Time";
    case "cardio":
      return "Cardio";
  }
}

export function trackingToRecordingType(type: string): RecordingType {
  switch (type) {
    case "Weight":
      return "strength";
    case "Repetitions":
      return "bodyweight";
    case "Time":
      return "timed";
    case "Cardio":
      return "cardio";
    default:
      return "strength";
  }
}

/** Map managed Exercise → thin catalog shape used by workout / analytics. */
export function toCatalogItem(exercise: Exercise): ExerciseCatalogItem {
  return {
    slug: exercise.slug,
    name: exercise.name,
    nameEs: exercise.nameEs,
    image: exercise.imagePath?.trim() ? exercise.imagePath : PLACEHOLDER,
    trackingType: recordingTypeToTracking(exercise.recordingType),
    defaultSets: exercise.defaults.sets,
    defaultRepRange:
      exercise.defaults.repMin != null && exercise.defaults.repMax != null
        ? { min: exercise.defaults.repMin, max: exercise.defaults.repMax }
        : null,
    defaultRestSeconds: exercise.defaults.restSeconds,
    defaultRir:
      exercise.defaults.targetRir != null
        ? {
            min: exercise.defaults.targetRir,
            max: exercise.defaults.targetRir,
          }
        : null,
    defaultLoad: exercise.defaults.initialLoad,
  };
}
