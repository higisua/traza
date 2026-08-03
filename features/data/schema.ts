/**
 * TRAZA export / backup schema.
 *
 * `schemaVersion` is the contract for future imports: newer app versions
 * must migrate older payloads via this field (never assume shape forever).
 *
 * Cloud-prep: this JSON document is the portable unit of user data.
 * When sync arrives, the same payload (or domain slices) can upload as-is;
 * migrations stay keyed by schemaVersion, not by transport.
 */

import type { AppSettings } from "@/lib/storage/settingsStorage";
import type { AnalyticsPeriod } from "@/features/analytics";
import type { WeightEntry } from "@/features/weight/WeightTypes";
import type { BloodPressureEntry } from "@/features/blood-pressure/BloodPressureTypes";
import type { SleepEntry } from "@/features/sleep/SleepTypes";
import type { StepsEntry } from "@/features/steps/StepsTypes";
import type { MeasurementEntry } from "@/features/measurements/MeasurementTypes";
import type {
  WorkoutSession,
  WorkoutTemplate,
} from "@/lib/storage/trainingStorage";
import type { Exercise } from "@/features/exercises/exerciseTypes";
import type { Routine, RoutineVersion } from "@/features/routines/routineTypes";

/** Bump only when the backup JSON shape changes incompatibly. */
export const TRAZA_EXPORT_SCHEMA_VERSION = 1 as const;

export type TrazaExportSchemaVersion = typeof TRAZA_EXPORT_SCHEMA_VERSION;

export const APP_VERSION = "0.1.0";

export type ExportFormat = "csv" | "excel" | "pdf" | "json";

export type ExportPeriodPreset =
  | "7d"
  | "30d"
  | "90d"
  | "year"
  | "all"
  | "custom";

export type ExportContentKey =
  | "weight"
  | "bodyFat"
  | "measurements"
  | "steps"
  | "sleep"
  | "bloodPressure"
  | "workouts"
  | "sets"
  | "personalRecords"
  | "insights"
  | "analytics";

export const ALL_EXPORT_CONTENT_KEYS: readonly ExportContentKey[] = [
  "weight",
  "bodyFat",
  "measurements",
  "bloodPressure",
  "sleep",
  "steps",
  "workouts",
  "sets",
  "personalRecords",
  "insights",
  "analytics",
] as const;

export const EXPORT_CONTENT_LABELS_ES: Record<ExportContentKey, string> = {
  weight: "Peso",
  bodyFat: "Composición corporal",
  measurements: "Medidas corporales",
  steps: "Pasos",
  sleep: "Sueño",
  bloodPressure: "Tensión",
  workouts: "Entrenamientos",
  sets: "Series",
  personalRecords: "PR",
  insights: "Insights",
  analytics: "Analytics",
};

/**
 * PDF detail only (non-PDF exports ignore this).
 * resumen = cover + executive + short conclusion;
 * completo = full narrative arc;
 * entrenador = narrative + technical appendix tables.
 */
export type PdfDetailLevel = "summary" | "full" | "coach";

export const PDF_DETAIL_COPY_ES: Record<
  PdfDetailLevel,
  { title: string; description: string }
> = {
  summary: {
    title: "Resumen",
    description: "2–3 páginas: lo esencial",
  },
  full: {
    title: "Completo",
    description: "Informe narrativo de evolución",
  },
  coach: {
    title: "Entrenador",
    description: "Narrativa + tablas técnicas (series, RIR, PR)",
  },
};

/** Why the user generated this — shown in history (not backup schema). */
export type ExportPurpose =
  | "analysis"
  | "chatgpt"
  | "coach"
  | "backup";

export const EXPORT_PURPOSE_LABELS_ES: Record<ExportPurpose, string> = {
  analysis: "Generado para análisis",
  chatgpt: "Compartido con ChatGPT",
  coach: "Informe entrenador",
  backup: "Backup",
};

/** Type label for history (format → human story). */
export const EXPORT_TYPE_LABELS_ES: Record<ExportFormat, string> = {
  pdf: "Informe TRAZA",
  excel: "Excel",
  csv: "CSV",
  json: "JSON",
};

/** Purpose-led format copy for the export wizard. */
export const EXPORT_FORMAT_COPY_ES: Record<
  ExportFormat,
  { title: string; description: string }
> = {
  csv: {
    title: "CSV",
    description: "Ideal para ChatGPT y hojas de cálculo",
  },
  excel: {
    title: "Excel",
    description: "Formato recomendado para análisis completos",
  },
  pdf: {
    title: "Informe TRAZA",
    description: "Informe narrativo de tu evolución",
  },
  json: {
    title: "JSON",
    description: "Copia completa de TRAZA",
  },
};

export type DateRange = {
  /** Inclusive YYYY-MM-DD */
  startDate: string;
  /** Inclusive YYYY-MM-DD */
  endDate: string;
};

/**
 * Full local backup — restore format.
 * Derived analytics/insights are optional and ignored on import.
 */
export type TrazaBackupPayload = {
  schemaVersion: TrazaExportSchemaVersion;
  appVersion: string;
  exportedAt: string;
  kind: "full_backup";
  settings: AppSettings;
  progressPeriod: AnalyticsPeriod;
  weightEntries: WeightEntry[];
  bloodPressureEntries: BloodPressureEntry[];
  sleepEntries: SleepEntry[];
  stepEntries: StepsEntry[];
  bodyMeasurements: MeasurementEntry[];
  workoutSessions: WorkoutSession[];
  workoutTemplates: WorkoutTemplate[];
  exercises: Exercise[];
  routines: Routine[];
  routineVersions: RoutineVersion[];
  /** Optional derived — not applied on restore. */
  analyticsSnapshot?: unknown;
  insightsSnapshot?: unknown;
};

export type RestoreMode = "replace" | "merge";

export type BackupRecordCounts = {
  weightEntries: number;
  bloodPressureEntries: number;
  sleepEntries: number;
  stepEntries: number;
  bodyMeasurements: number;
  workoutSessions: number;
  workoutTemplates: number;
  exercises: number;
  routines: number;
  routineVersions: number;
};

export function emptyRecordCounts(): BackupRecordCounts {
  return {
    weightEntries: 0,
    bloodPressureEntries: 0,
    sleepEntries: 0,
    stepEntries: 0,
    bodyMeasurements: 0,
    workoutSessions: 0,
    workoutTemplates: 0,
    exercises: 0,
    routines: 0,
    routineVersions: 0,
  };
}

export function countsFromBackup(
  payload: TrazaBackupPayload,
): BackupRecordCounts {
  return {
    weightEntries: payload.weightEntries.length,
    bloodPressureEntries: payload.bloodPressureEntries.length,
    sleepEntries: payload.sleepEntries.length,
    stepEntries: payload.stepEntries.length,
    bodyMeasurements: payload.bodyMeasurements.length,
    workoutSessions: payload.workoutSessions.length,
    workoutTemplates: payload.workoutTemplates.length,
    exercises: payload.exercises.length,
    routines: payload.routines.length,
    routineVersions: payload.routineVersions.length,
  };
}
