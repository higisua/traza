import exerciseSeed from "@/seed/exercise_seed.json";
import { inferBodyZone } from "./exerciseCatalogs";
import { trackingToRecordingType } from "./exerciseMapping";
import type {
  Exercise,
  ExerciseDefaults,
  LoadIncrement,
  LoadType,
  RecordingType,
} from "./exerciseTypes";

type SeedExercise = {
  slug: string;
  name: string;
  image: string;
  primaryMuscle: string;
  secondaryMuscles?: string[];
  movementPattern?: string;
  equipment?: string;
  trackingType: string;
  loadType?: string;
  defaultSets: number;
  defaultRepRange?: { min: number; max: number };
  defaultRestSeconds: number;
  defaultRir?: { min: number; max: number };
  isBilateral?: boolean;
  techniqueTip?: string;
  setupNote?: string;
  isSeed?: boolean;
};

/** Cold-start prescription loads (kg) — same values WorkoutCatalog used. */
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

function asLoadType(value: string | undefined): LoadType {
  if (
    value === "Total Weight" ||
    value === "Per Dumbbell" ||
    value === "Per Side" ||
    value === "Bodyweight" ||
    value === "N/A" ||
    value === "Assistance"
  ) {
    return value;
  }
  return "Total Weight";
}

function defaultIncrement(type: RecordingType): LoadIncrement {
  return type === "strength" ? 2.5 : 1;
}

function buildDefaults(seed: SeedExercise, type: RecordingType): ExerciseDefaults {
  const initialLoad =
    type === "strength" ? (DEFAULT_LOAD_KG[seed.slug] ?? 20) : null;
  const rir =
    seed.defaultRir != null
      ? Math.round((seed.defaultRir.min + seed.defaultRir.max) / 2)
      : type === "timed" || type === "cardio"
        ? null
        : 2;

  return {
    sets: seed.defaultSets,
    repMin: seed.defaultRepRange?.min ?? null,
    repMax: seed.defaultRepRange?.max ?? null,
    targetRir: rir,
    restSeconds: seed.defaultRestSeconds,
    loadIncrement: defaultIncrement(type),
    initialLoad,
    loadUnit: "kg",
  };
}

export function buildSeedExercises(now = new Date().toISOString()): Exercise[] {
  return (exerciseSeed as SeedExercise[]).map((seed) => {
    const recordingType = trackingToRecordingType(seed.trackingType);
    return {
      id: seed.slug,
      slug: seed.slug,
      name: seed.name,
      nameEs: EXERCISE_NAMES_ES[seed.slug] ?? seed.name,
      status: "active" as const,
      recordingType,
      primaryMuscle: seed.primaryMuscle,
      secondaryMuscles: seed.secondaryMuscles ?? [],
      movementPattern: seed.movementPattern ?? null,
      equipment: seed.equipment ?? null,
      loadType: asLoadType(seed.loadType),
      bodyZone: inferBodyZone(seed.primaryMuscle),
      defaults: buildDefaults(seed, recordingType),
      imagePath: seed.image || null,
      techniqueTip: seed.techniqueTip || null,
      setupNote: seed.setupNote || null,
      isBilateral: seed.isBilateral ?? true,
      isSeed: true,
      createdAt: now,
      updatedAt: now,
    };
  });
}

export const SEED_EXERCISE_COUNT = (exerciseSeed as SeedExercise[]).length;
