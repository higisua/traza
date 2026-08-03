import { WeightRepository } from "@/features/weight/WeightRepository";
import { BloodPressureRepository } from "@/features/blood-pressure/BloodPressureRepository";
import { SleepRepository } from "@/features/sleep/SleepRepository";
import { StepsRepository } from "@/features/steps/StepsRepository";
import { MeasurementRepository } from "@/features/measurements/MeasurementRepository";
import { WorkoutRepository } from "@/features/workout/WorkoutRepository";
import { ExerciseRepository } from "@/features/exercises/exerciseRepository";
import { RoutineRepository } from "@/features/routines/routineRepository";
import { trainingStorage } from "@/lib/storage/trainingStorage";
import { settingsStorage } from "@/lib/storage/settingsStorage";
import { storageKey } from "@/lib/storage/localStorage";
import { TRAZA_EXPORT_SCHEMA_VERSION, APP_VERSION } from "./schema";
import { getDataMeta } from "./dataMeta";
import type { BackupRecordCounts } from "./schema";
import { emptyRecordCounts } from "./schema";

export type StorageInfo = {
  schemaVersion: typeof TRAZA_EXPORT_SCHEMA_VERSION;
  appVersion: string;
  storagePrefix: string;
  recordCounts: BackupRecordCounts;
  totalRecords: number;
  /** Approximate bytes used by TRAZA localStorage keys. */
  approximateBytes: number;
  lastBackupAt: string | null;
  lastBackupSchemaVersion: number | null;
  lastBackupAppVersion: string | null;
  lastExportAt: string | null;
  lastExportFormat: string | null;
  lastExportPeriodLabel: string | null;
  settingsDisplayName: string;
};

const TRACKED_KEYS = [
  "weight_entries",
  "blood_pressure_entries",
  "sleep_entries",
  "step_entries",
  "body_measurements",
  "workout_sessions",
  "workout_templates",
  "exercises",
  "routines",
  "routine_versions",
  "settings",
  "progress_period",
  "data_meta",
] as const;

function keyByteSize(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    // UTF-16 approx used by browsers for quota estimates
    return key.length * 2 + raw.length * 2;
  } catch {
    return 0;
  }
}

function safeCount(read: () => unknown): number {
  try {
    const value = read();
    return Array.isArray(value) ? value.length : 0;
  } catch {
    return 0;
  }
}

export function getStorageInfo(): StorageInfo {
  const meta = getDataMeta();
  const counts: BackupRecordCounts = {
    ...emptyRecordCounts(),
    weightEntries: safeCount(() => WeightRepository.getAll()),
    bloodPressureEntries: safeCount(() => BloodPressureRepository.getAll()),
    sleepEntries: safeCount(() => SleepRepository.getAll()),
    stepEntries: safeCount(() => StepsRepository.getAll()),
    bodyMeasurements: safeCount(() => MeasurementRepository.getAll()),
    workoutSessions: safeCount(() => WorkoutRepository.getSessions()),
    workoutTemplates: safeCount(() => trainingStorage.getTemplates()),
    exercises: safeCount(() => ExerciseRepository.getAll()),
    routines: safeCount(() => RoutineRepository.getAll()),
    routineVersions: safeCount(() => RoutineRepository.getAllVersions()),
  };

  let approximateBytes = 0;
  for (const name of TRACKED_KEYS) {
    approximateBytes += keyByteSize(storageKey(name));
  }

  let settingsDisplayName = "—";
  try {
    const settings = settingsStorage.get();
    settingsDisplayName =
      typeof settings.displayName === "string" && settings.displayName.trim()
        ? settings.displayName
        : "—";
  } catch {
    settingsDisplayName = "—";
  }

  return {
    schemaVersion: TRAZA_EXPORT_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    storagePrefix: "traza:v1:",
    recordCounts: counts,
    totalRecords:
      counts.weightEntries +
      counts.bloodPressureEntries +
      counts.sleepEntries +
      counts.stepEntries +
      counts.bodyMeasurements +
      counts.workoutSessions +
      counts.workoutTemplates +
      counts.exercises +
      counts.routines +
      counts.routineVersions,
    approximateBytes,
    lastBackupAt: meta.lastBackupAt,
    lastBackupSchemaVersion: meta.lastBackupSchemaVersion,
    lastBackupAppVersion: meta.lastBackupAppVersion,
    lastExportAt: meta.lastExportAt,
    lastExportFormat: meta.lastExportFormat,
    lastExportPeriodLabel: meta.lastExportPeriodLabel,
    settingsDisplayName,
  };
}

export function formatBytesEs(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
