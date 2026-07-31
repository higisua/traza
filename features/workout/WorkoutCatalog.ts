import exerciseSeed from "@/seed/exercise_seed.json";
import workoutSeed from "@/seed/workout_seed.json";
import type {
  ExerciseCatalogItem,
  RoutineCatalogItem,
  RoutineExercisePlan,
  TrackingType,
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

const EXERCISE_NAMES_ES: Record<string, string> = {
  "hack-squat": "Hack squat",
  "machine-chest-press": "Press de pecho en máquina",
  "chest-supported-row": "Remo con pecho apoyado",
  "seated-leg-curl": "Curl femoral sentado",
  "machine-lateral-raise": "Elevaciones laterales en máquina",
  "rope-triceps-pushdown": "Extensiones de tríceps en polea",
  "leg-press-calf-raise": "Gemelos en prensa",
  elliptical: "Elíptica",
  "smith-romanian-deadlift": "Peso muerto rumano en Smith",
  "machine-incline-chest-press": "Press inclinado en máquina",
  "neutral-grip-lat-pulldown": "Jalón agarre neutro",
  "leg-press": "Prensa de piernas",
  "machine-shoulder-press": "Press de hombros en máquina",
  "cable-biceps-curl": "Curl de bíceps en polea",
  "cable-crunch": "Crunch en polea",
  "leg-extension": "Extensión de cuádriceps",
  "machine-hip-thrust": "Hip thrust en máquina",
  "pec-deck": "Pec deck",
  "high-row-machine": "Remo alto en máquina",
  "lateral-raise": "Elevaciones laterales",
  "reverse-pec-deck": "Pec deck inverso",
  "preacher-curl": "Curl predicador",
  "overhead-triceps-extension": "Extensión de tríceps overhead",
  "standing-calf-raise": "Gemelos de pie",
  "pallof-press": "Pallof press",
  "push-up": "Flexiones",
  "reverse-lunge": "Zancadas inversas",
  "single-leg-calf-raise": "Gemelo a una pierna",
  "side-plank": "Plancha lateral",
};

type SeedExercise = {
  slug: string;
  name: string;
  image: string;
  trackingType: string;
  defaultSets: number;
  defaultRepRange?: { min: number; max: number };
  defaultRestSeconds: number;
  defaultRir?: { min: number; max: number };
  defaultLoad?: number;
};

/** Cold-start prescription loads (kg) when seed has none and no history. */
const DEFAULT_LOAD_KG: Record<string, number> = {
  "hack-squat": 50,
  "machine-chest-press": 40,
  "chest-supported-row": 40,
  "seated-leg-curl": 35,
  "machine-lateral-raise": 10,
  "rope-triceps-pushdown": 25,
  "leg-press-calf-raise": 60,
  "smith-romanian-deadlift": 40,
  "machine-incline-chest-press": 35,
  "neutral-grip-lat-pulldown": 40,
  "leg-press": 80,
  "machine-shoulder-press": 30,
  "cable-biceps-curl": 20,
  "cable-crunch": 25,
  "leg-extension": 35,
  "machine-hip-thrust": 50,
  "pec-deck": 30,
  "high-row-machine": 40,
  "lateral-raise": 8,
  "reverse-pec-deck": 25,
  "preacher-curl": 20,
  "overhead-triceps-extension": 20,
  "standing-calf-raise": 40,
  "pallof-press": 15,
  "reverse-lunge": 16,
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

function asTrackingType(value: string): TrackingType {
  if (
    value === "Weight" ||
    value === "Repetitions" ||
    value === "Time" ||
    value === "Cardio"
  ) {
    return value;
  }
  return "Weight";
}

const exercises: ExerciseCatalogItem[] = (exerciseSeed as SeedExercise[]).map(
  (item) => {
    const trackingType = asTrackingType(item.trackingType);
    const defaultLoad =
      item.defaultLoad ??
      (trackingType === "Weight"
        ? (DEFAULT_LOAD_KG[item.slug] ?? 20)
        : null);
    return {
      slug: item.slug,
      name: item.name,
      nameEs: EXERCISE_NAMES_ES[item.slug] ?? item.name,
      image: item.image,
      trackingType,
      defaultSets: item.defaultSets,
      defaultRepRange: item.defaultRepRange ?? null,
      defaultRestSeconds: item.defaultRestSeconds,
      defaultRir: item.defaultRir ?? null,
      defaultLoad,
    };
  },
);

const exerciseBySlug = new Map(
  exercises.map((exercise) => [exercise.slug, exercise]),
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
        const exercise = exerciseBySlug.get(seedExercise.exerciseSlug);
        if (!exercise) return null;
        return buildPlan(seedExercise, exercise);
      })
      .filter((item): item is RoutineExercisePlan => item !== null)
      .sort((a, b) => a.order - b.order);

    const cover =
      exerciseBySlug.get(plans[0]?.exerciseSlug ?? "")?.image ??
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

export const WorkoutCatalog = {
  listRoutines(): RoutineCatalogItem[] {
    return routines;
  },

  getRoutine(slug: string): RoutineCatalogItem | null {
    return routineBySlug.get(slug) ?? null;
  },

  getExercise(slug: string): ExerciseCatalogItem | null {
    return exerciseBySlug.get(slug) ?? null;
  },

  listExercises(): ExerciseCatalogItem[] {
    return exercises;
  },
};
