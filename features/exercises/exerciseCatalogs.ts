/**
 * Classification catalogs reused from seed values — single lists, no duplicates.
 */

export const PRIMARY_MUSCLES = [
  "Back",
  "Biceps",
  "Calves",
  "Cardio",
  "Chest",
  "Core",
  "Glutes",
  "Hamstrings",
  "Quadriceps",
  "Shoulders",
  "Triceps",
] as const;

export const SECONDARY_MUSCLES = [
  "Biceps",
  "Calves",
  "Front Delts",
  "Glutes",
  "Hamstrings",
  "Obliques",
  "Rear Delts",
  "Triceps",
  "Upper Back",
  "Upper Traps",
] as const;

export const MOVEMENT_PATTERNS = [
  "Cardio",
  "Core",
  "Hinge",
  "Pull",
  "Push",
  "Squat",
] as const;

export const EQUIPMENT_OPTIONS = [
  "Bodyweight",
  "Cable",
  "Cardio",
  "Dumbbell",
  "Machine",
  "Smith",
] as const;

export const LOAD_TYPE_OPTIONS = [
  "Total Weight",
  "Per Dumbbell",
  "Per Side",
  "Bodyweight",
  "N/A",
  "Assistance",
] as const;

export const BODY_ZONES = [
  "Lower body",
  "Upper body",
  "Core",
  "Full body",
  "Cardio",
] as const;

/** Spanish labels for classification / recording UI. */
export const MUSCLE_LABELS_ES: Record<string, string> = {
  Back: "Espalda",
  Biceps: "Bíceps",
  Calves: "Gemelos",
  Cardio: "Cardio",
  Chest: "Pecho",
  Core: "Core",
  Glutes: "Glúteos",
  Hamstrings: "Isquiotibiales",
  Quadriceps: "Cuádriceps",
  Shoulders: "Hombros",
  Triceps: "Tríceps",
  "Front Delts": "Deltoides anteriores",
  "Rear Delts": "Deltoides posteriores",
  Obliques: "Oblicuos",
  "Upper Back": "Espalda alta",
  "Upper Traps": "Trapecio superior",
};

export const PATTERN_LABELS_ES: Record<string, string> = {
  Cardio: "Cardio",
  Core: "Core",
  Hinge: "Bisagra",
  Pull: "Tirón",
  Push: "Empuje",
  Squat: "Sentadilla",
};

export const EQUIPMENT_LABELS_ES: Record<string, string> = {
  Bodyweight: "Peso corporal",
  Cable: "Polea",
  Cardio: "Cardio",
  Dumbbell: "Mancuerna",
  Machine: "Máquina",
  Smith: "Smith",
};

export const RECORDING_TYPE_LABELS_ES: Record<string, string> = {
  strength: "Fuerza",
  bodyweight: "Peso corporal",
  timed: "Tiempo",
  cardio: "Cardio",
};

export const LOAD_TYPE_LABELS_ES: Record<string, string> = {
  "Total Weight": "Peso total",
  "Per Dumbbell": "Por mancuerna",
  "Per Side": "Por lado",
  Bodyweight: "Peso corporal",
  "N/A": "N/A",
  Assistance: "Asistencia",
};

export const BODY_ZONE_LABELS_ES: Record<string, string> = {
  "Lower body": "Tren inferior",
  "Upper body": "Tren superior",
  Core: "Core",
  "Full body": "Cuerpo completo",
  Cardio: "Cardio",
};

export function muscleLabelEs(value: string): string {
  return MUSCLE_LABELS_ES[value] ?? value;
}

export function inferBodyZone(primaryMuscle: string): string {
  switch (primaryMuscle) {
    case "Quadriceps":
    case "Hamstrings":
    case "Glutes":
    case "Calves":
      return "Lower body";
    case "Chest":
    case "Back":
    case "Shoulders":
    case "Biceps":
    case "Triceps":
      return "Upper body";
    case "Core":
      return "Core";
    case "Cardio":
      return "Cardio";
    default:
      return "Full body";
  }
}
