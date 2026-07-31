import type {
  BloodPressureCategory,
  BloodPressureCategoryId,
} from "./BloodPressureTypes";

const CATEGORIES: Record<BloodPressureCategoryId, BloodPressureCategory> = {
  optimal: { id: "optimal", label: "Óptima", tone: "optimal" },
  normal: { id: "normal", label: "Normal", tone: "normal" },
  high_normal: { id: "high_normal", label: "Normal-alta", tone: "caution" },
  grade1: { id: "grade1", label: "Hipertensión grado 1", tone: "elevated" },
  grade2: { id: "grade2", label: "Hipertensión grado 2", tone: "high" },
  grade3: { id: "grade3", label: "Hipertensión grado 3", tone: "critical" },
};

const RANK: Record<BloodPressureCategoryId, number> = {
  optimal: 0,
  normal: 1,
  high_normal: 2,
  grade1: 3,
  grade2: 4,
  grade3: 5,
};

function categoryFromSystolic(systolic: number): BloodPressureCategoryId {
  if (systolic >= 180) return "grade3";
  if (systolic >= 160) return "grade2";
  if (systolic >= 140) return "grade1";
  if (systolic >= 130) return "high_normal";
  if (systolic >= 120) return "normal";
  return "optimal";
}

function categoryFromDiastolic(diastolic: number): BloodPressureCategoryId {
  if (diastolic >= 110) return "grade3";
  if (diastolic >= 100) return "grade2";
  if (diastolic >= 90) return "grade1";
  if (diastolic >= 85) return "high_normal";
  if (diastolic >= 80) return "normal";
  return "optimal";
}

/**
 * ESC/ESH office BP: take the higher severity between systolic and diastolic.
 * Informational only — not a medical diagnosis.
 */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number,
): BloodPressureCategory {
  const fromSys = categoryFromSystolic(systolic);
  const fromDia = categoryFromDiastolic(diastolic);
  const id = RANK[fromSys] >= RANK[fromDia] ? fromSys : fromDia;
  return CATEGORIES[id];
}

export function formatBloodPressureReading(
  systolic: number,
  diastolic: number,
): string {
  return `${systolic} / ${diastolic}`;
}

export function formatPulse(pulse: number): string {
  return `${pulse} ppm`;
}
