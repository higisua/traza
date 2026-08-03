import { ExerciseRepository } from "@/features/exercises/exerciseRepository";
import { toCatalogItem as exerciseToCatalogItem } from "@/features/exercises/exerciseMapping";
import { buildSeedExercises } from "@/features/exercises/exerciseSeed";
import { EXERCISE_IMAGE_PLACEHOLDER } from "@/features/exercises/exerciseImageRepository";
import { RoutineRepository } from "@/features/routines/routineRepository";
import { toCatalogItem as routineToCatalogItem } from "@/features/routines/routineMapping";
import { buildSeedRoutines } from "@/features/routines/routineSeed";
import type {
  ExerciseCatalogItem,
  RoutineCatalogItem,
} from "./WorkoutTypes";

/**
 * Static fallback from seed — SSR + cold start before localStorage hydrate.
 */
const fallbackExercises: ExerciseCatalogItem[] = buildSeedExercises().map(
  exerciseToCatalogItem,
);

const fallbackBySlug = new Map(
  fallbackExercises.map((exercise) => [exercise.slug, exercise]),
);

const seedPack = buildSeedRoutines();
const fallbackRoutines: RoutineCatalogItem[] = seedPack.routines.map(
  (routine) => {
    const version =
      seedPack.versions.find((item) => item.id === routine.currentVersionId) ??
      seedPack.versions.find((item) => item.routineId === routine.id);
    if (!version) {
      return {
        slug: routine.slug,
        name: routine.name,
        nameEs: routine.nameEs,
        description: routine.description,
        estimatedDurationMinutes: 45,
        exerciseCount: 0,
        coverImage: EXERCISE_IMAGE_PLACEHOLDER,
        exercises: [],
      };
    }
    const coverSlug = version.blocks[0]?.exerciseSlug;
    const cover =
      (coverSlug ? fallbackBySlug.get(coverSlug)?.image : null) ||
      EXERCISE_IMAGE_PLACEHOLDER;
    return routineToCatalogItem(routine, version, cover);
  },
);

const fallbackRoutineBySlug = new Map(
  fallbackRoutines.map((routine) => [routine.slug, routine]),
);

function resolveExercise(slug: string): ExerciseCatalogItem | null {
  if (typeof window !== "undefined") {
    const live = ExerciseRepository.getBySlug(slug);
    if (live) return exerciseToCatalogItem(live);
  }
  return fallbackBySlug.get(slug) ?? null;
}

function coverForVersion(
  version: { blocks: Array<{ exerciseSlug: string }> },
): string {
  const first = version.blocks[0]?.exerciseSlug;
  if (!first) return EXERCISE_IMAGE_PLACEHOLDER;
  return resolveExercise(first)?.image || EXERCISE_IMAGE_PLACEHOLDER;
}

function liveRoutineToCatalog(
  routine: NonNullable<ReturnType<typeof RoutineRepository.getBySlug>>,
  versionId?: string | null,
): RoutineCatalogItem | null {
  const version = versionId
    ? RoutineRepository.getVersionById(versionId)
    : RoutineRepository.getCurrentVersion(routine);
  if (!version) return null;
  return routineToCatalogItem(routine, version, coverForVersion(version));
}

export const WorkoutCatalog = {
  /**
   * Active routines for Entrenar.
   * Client: managed repository. SSR: seed fallback.
   */
  listRoutines(): RoutineCatalogItem[] {
    if (typeof window !== "undefined") {
      const live = RoutineRepository.getActive();
      if (live.length > 0) {
        return live
          .map((routine) => liveRoutineToCatalog(routine))
          .filter((item): item is RoutineCatalogItem => item !== null);
      }
    }
    return fallbackRoutines;
  },

  /**
   * Resolve by slug — any status (history / deep links).
   * Prefer current version unless a specific version id is provided.
   */
  getRoutine(
    slug: string,
    versionId?: string | null,
  ): RoutineCatalogItem | null {
    if (typeof window !== "undefined") {
      const live = RoutineRepository.getBySlug(slug);
      if (live) {
        return liveRoutineToCatalog(live, versionId);
      }
    }
    if (versionId) {
      // SSR / missing live: only current seed versions exist as fallback.
      const seedVersion = seedPack.versions.find((item) => item.id === versionId);
      if (seedVersion) {
        const routine = seedPack.routines.find(
          (item) => item.id === seedVersion.routineId,
        );
        if (routine) {
          return routineToCatalogItem(
            routine,
            seedVersion,
            coverForVersion(seedVersion),
          );
        }
      }
    }
    return fallbackRoutineBySlug.get(slug) ?? null;
  },

  /** Resolve the exact version a session used (history protection). */
  getRoutineByVersionId(versionId: string): RoutineCatalogItem | null {
    if (typeof window !== "undefined") {
      const version = RoutineRepository.getVersionById(versionId);
      if (version) {
        const routine = RoutineRepository.getById(version.routineId);
        if (routine) {
          return routineToCatalogItem(
            routine,
            version,
            coverForVersion(version),
          );
        }
      }
    }
    const seedVersion = seedPack.versions.find((item) => item.id === versionId);
    if (!seedVersion) return null;
    const routine = seedPack.routines.find(
      (item) => item.id === seedVersion.routineId,
    );
    if (!routine) return null;
    return routineToCatalogItem(
      routine,
      seedVersion,
      coverForVersion(seedVersion),
    );
  },

  /**
   * Session-aware plan resolution.
   * Prefers templateVersionId so mid-life routine edits never rewrite history.
   */
  getRoutineForSession(session: {
    templateId: string | null;
    templateVersionId: string | null;
  }): RoutineCatalogItem | null {
    if (session.templateVersionId) {
      const byVersion = this.getRoutineByVersionId(session.templateVersionId);
      if (byVersion) return byVersion;
    }
    if (session.templateId) {
      return this.getRoutine(session.templateId);
    }
    return null;
  },

  getExercise(slug: string): ExerciseCatalogItem | null {
    return resolveExercise(slug);
  },

  listExercises(): ExerciseCatalogItem[] {
    if (typeof window !== "undefined") {
      const live = ExerciseRepository.getAll();
      if (live.length > 0) {
        return live.map(exerciseToCatalogItem);
      }
    }
    return fallbackExercises;
  },

  /** Active-only — routine constructor / session selectors. */
  listActiveExercises(): ExerciseCatalogItem[] {
    if (typeof window !== "undefined") {
      return ExerciseRepository.getActive().map(exerciseToCatalogItem);
    }
    return fallbackExercises;
  },
};
