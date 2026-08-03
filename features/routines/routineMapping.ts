import type { RoutineCatalogItem, RoutineExercisePlan } from "@/features/workout/WorkoutTypes";
import type { Routine, RoutineBlock, RoutineVersion } from "./routineTypes";

export function blockToPlan(block: RoutineBlock): RoutineExercisePlan {
  return {
    exerciseSlug: block.exerciseSlug,
    order: block.order,
    sets: block.sets,
    repRange:
      block.repMin != null && block.repMax != null
        ? { min: block.repMin, max: block.repMax }
        : block.repMin != null
          ? { min: block.repMin, max: block.repMin }
          : block.repMax != null
            ? { min: block.repMax, max: block.repMax }
            : null,
    rir:
      block.rirMin != null && block.rirMax != null
        ? { min: block.rirMin, max: block.rirMax }
        : block.rirMin != null
          ? { min: block.rirMin, max: block.rirMin }
          : block.rirMax != null
            ? { min: block.rirMax, max: block.rirMax }
            : null,
    restSeconds: block.restSeconds,
    durationMinutes: block.durationMinutes,
    durationSeconds: block.durationSeconds,
    pair: block.pairGroup,
  };
}

export function toCatalogItem(
  routine: Routine,
  version: RoutineVersion,
  coverImage: string,
): RoutineCatalogItem {
  const exercises = [...version.blocks]
    .sort((a, b) => a.order - b.order)
    .map(blockToPlan);

  return {
    slug: routine.slug,
    name: routine.name,
    nameEs: routine.nameEs,
    description: routine.description,
    estimatedDurationMinutes: version.estimatedDurationMinutes,
    exerciseCount: version.exerciseCount,
    coverImage,
    exercises,
  };
}

export function estimateDurationFromBlocks(blocks: RoutineBlock[]): number {
  if (blocks.length === 0) return 15;

  let seconds = 0;
  for (const block of blocks) {
    if (block.durationMinutes != null) {
      seconds += block.durationMinutes * 60 * Math.max(1, block.sets);
    } else if (block.durationSeconds != null) {
      seconds += block.durationSeconds * Math.max(1, block.sets);
    } else {
      // ~45s working + rest between sets
      const work = 45 * block.sets;
      const rest = block.restSeconds * Math.max(0, block.sets - 1);
      seconds += work + rest;
    }
    // Transition between exercises
    seconds += 30;
  }

  return Math.max(10, Math.round(seconds / 60));
}
