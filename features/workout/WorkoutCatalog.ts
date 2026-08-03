import workoutSeed from "@/seed/workout_seed.json";
import { ExerciseRepository } from "@/features/exercises/exerciseRepository";
import { toCatalogItem } from "@/features/exercises/exerciseMapping";
import { buildSeedExercises } from "@/features/exercises/exerciseSeed";
import type {
  ExerciseCatalogItem,
  RoutineCatalogItem,
  RoutineExercisePlan,
} from "./WorkoutTypes";

const ROUTINE_NAMES_ES: Record<string, string> = {
  "day-a": "Día A",
  "day-b": "Día B",
  "day-c": "Día C",
  home: "Casa",
};

const ROUTINE_DESCRIPTIONS_ES: Record<string, string> = {
  "day-a": "Full body A",
  "day-b": "Full body B",
  "day-c": "Full body opcional",
  home: "Sesión corta en casa",
};

type SeedRoutineExercise = {
  exerciseSlug: string;
  order: number;
  sets?: number;
  repRange?: { min: number; max: number };
  rir?: { min: number; max: number };
  restSeconds?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  pair?: string;
};

type SeedRoutine = {
  slug: string;
  name: string;
  description: string;
  estimatedDurationMinutes: number;
  exercises: SeedRoutineExercise[];
};

/**
 * Static fallback catalog from seed — used for SSR and routine plan baking.
 * Live lookups prefer ExerciseRepository (managed catalog) when available.
 */
const fallbackExercises: ExerciseCatalogItem[] = buildSeedExercises().map(
  toCatalogItem,
);

const fallbackBySlug = new Map(
  fallbackExercises.map((exercise) => [exercise.slug, exercise]),
);

function buildPlan(
  seed: SeedRoutineExercise,
  exercise: ExerciseCatalogItem,
): RoutineExercisePlan {
  return {
    exerciseSlug: seed.exerciseSlug,
    order: seed.order,
    sets: seed.sets ?? (seed.durationMinutes ? 1 : exercise.defaultSets),
    repRange: seed.repRange ?? exercise.defaultRepRange,
    rir: seed.rir ?? exercise.defaultRir,
    restSeconds:
      seed.restSeconds ??
      (seed.durationMinutes ? 0 : exercise.defaultRestSeconds || 90),
    durationMinutes: seed.durationMinutes ?? null,
    durationSeconds: seed.durationSeconds ?? null,
    pair: seed.pair ?? null,
  };
}

const routines: RoutineCatalogItem[] = (workoutSeed as SeedRoutine[]).map(
  (routine) => {
    const plans = routine.exercises
      .map((seedExercise) => {
        const exercise = fallbackBySlug.get(seedExercise.exerciseSlug);
        if (!exercise) return null;
        return buildPlan(seedExercise, exercise);
      })
      .filter((item): item is RoutineExercisePlan => item !== null)
      .sort((a, b) => a.order - b.order);

    const cover =
      fallbackBySlug.get(plans[0]?.exerciseSlug ?? "")?.image ||
      "/exercises/hack-squat.png";

    return {
      slug: routine.slug,
      name: routine.name,
      nameEs: ROUTINE_NAMES_ES[routine.slug] ?? routine.name,
      description:
        ROUTINE_DESCRIPTIONS_ES[routine.slug] ?? routine.description,
      estimatedDurationMinutes: routine.estimatedDurationMinutes,
      exerciseCount: plans.length,
      coverImage: cover,
      exercises: plans,
    };
  },
);

const routineBySlug = new Map(routines.map((routine) => [routine.slug, routine]));

function resolveExercise(slug: string): ExerciseCatalogItem | null {
  if (typeof window !== "undefined") {
    const live = ExerciseRepository.getBySlug(slug);
    if (live) return toCatalogItem(live);
  }
  return fallbackBySlug.get(slug) ?? null;
}

export const WorkoutCatalog = {
  listRoutines(): RoutineCatalogItem[] {
    return routines;
  },

  getRoutine(slug: string): RoutineCatalogItem | null {
    return routineBySlug.get(slug) ?? null;
  },

  getExercise(slug: string): ExerciseCatalogItem | null {
    return resolveExercise(slug);
  },

  listExercises(): ExerciseCatalogItem[] {
    if (typeof window !== "undefined") {
      const live = ExerciseRepository.getAll();
      if (live.length > 0) {
        return live.map(toCatalogItem);
      }
    }
    return fallbackExercises;
  },

  /** Active-only — for future routine/session selectors. */
  listActiveExercises(): ExerciseCatalogItem[] {
    if (typeof window !== "undefined") {
      return ExerciseRepository.getActive().map(toCatalogItem);
    }
    return fallbackExercises;
  },
};
