import { readJson, writeJson, storageKey } from "@/lib/storage/localStorage";
import { settingsStorage, type AppSettings } from "@/lib/storage/settingsStorage";
import { setProgressPeriod } from "@/features/progress/ProgressPeriodStore";
import { WeightRepository } from "@/features/weight/WeightRepository";
import { BloodPressureRepository } from "@/features/blood-pressure/BloodPressureRepository";
import { SleepRepository } from "@/features/sleep/SleepRepository";
import { StepsRepository } from "@/features/steps/StepsRepository";
import { MeasurementRepository } from "@/features/measurements/MeasurementRepository";
import { ExerciseRepository } from "@/features/exercises/exerciseRepository";
import { RoutineRepository } from "@/features/routines/routineRepository";
import type { AnalyticsPeriod } from "@/features/analytics";
import type {
  BackupRecordCounts,
  RestoreMode,
  TrazaBackupPayload,
  TrazaExportSchemaVersion,
} from "./schema";
import {
  APP_VERSION,
  TRAZA_EXPORT_SCHEMA_VERSION,
  countsFromBackup,
} from "./schema";
import { markBackupDone } from "./dataMeta";

export type RestoreSummary = {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  recordCounts: BackupRecordCounts;
  supported: boolean;
  warnings: string[];
};

export type ParseBackupResult =
  | { ok: true; payload: TrazaBackupPayload; summary: RestoreSummary }
  | { ok: false; error: string };

type IdEntity = { id: string; updatedAt?: string; createdAt?: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Future TRAZA versions migrate here by schemaVersion.
 * v1 → current shape is identity.
 */
export function migrateBackupPayload(
  raw: Record<string, unknown>,
): { payload: TrazaBackupPayload; warnings: string[] } {
  const warnings: string[] = [];
  const schemaVersion = Number(raw.schemaVersion);

  if (!Number.isFinite(schemaVersion) || schemaVersion < 1) {
    throw new Error("Falta schemaVersion válido en la copia.");
  }

  if (schemaVersion > TRAZA_EXPORT_SCHEMA_VERSION) {
    warnings.push(
      `Esta copia usa schemaVersion ${schemaVersion}; TRAZA actual es ${TRAZA_EXPORT_SCHEMA_VERSION}. Puede haber campos desconocidos.`,
    );
  }

  if (schemaVersion < TRAZA_EXPORT_SCHEMA_VERSION) {
    // Placeholder for future migrations (e.g. v1 → v2 field renames).
    warnings.push(
      `Copia antigua (schemaVersion ${schemaVersion}); se aplicará migración al formato actual.`,
    );
  }

  // v1 identity (and unknown older handled above)
  const payload: TrazaBackupPayload = {
    schemaVersion: TRAZA_EXPORT_SCHEMA_VERSION as TrazaExportSchemaVersion,
    appVersion:
      typeof raw.appVersion === "string" ? raw.appVersion : "unknown",
    exportedAt:
      typeof raw.exportedAt === "string"
        ? raw.exportedAt
        : new Date().toISOString(),
    kind: "full_backup",
    settings: normalizeSettings(raw.settings),
    progressPeriod: normalizePeriod(raw.progressPeriod),
    weightEntries: asArray(raw.weightEntries),
    bloodPressureEntries: asArray(raw.bloodPressureEntries),
    sleepEntries: asArray(raw.sleepEntries),
    stepEntries: asArray(raw.stepEntries),
    bodyMeasurements: asArray(raw.bodyMeasurements),
    workoutSessions: asArray(raw.workoutSessions),
    workoutTemplates: asArray(raw.workoutTemplates),
    exercises: asArray(raw.exercises),
    routines: asArray(raw.routines),
    routineVersions: asArray(raw.routineVersions),
    // derived ignored on restore
  };

  return { payload, warnings };
}

function normalizeSettings(raw: unknown): AppSettings {
  const base = settingsStorage.get();
  if (!isObject(raw)) return base;
  return {
    displayName:
      typeof raw.displayName === "string" ? raw.displayName : base.displayName,
    units: "metric",
    theme: "light",
  };
}

function normalizePeriod(raw: unknown): AnalyticsPeriod {
  if (raw === "7d" || raw === "30d" || raw === "90d" || raw === "all") {
    return raw;
  }
  return "30d";
}

export function parseBackupJson(text: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "El archivo no es un JSON válido." };
  }

  if (!isObject(parsed)) {
    return { ok: false, error: "La copia debe ser un objeto JSON." };
  }

  if (parsed.kind != null && parsed.kind !== "full_backup") {
    return {
      ok: false,
      error: "Este JSON no es una copia de seguridad TRAZA (kind ≠ full_backup).",
    };
  }

  try {
    const { payload, warnings } = migrateBackupPayload(parsed);
    const summary: RestoreSummary = {
      schemaVersion: Number(parsed.schemaVersion) || payload.schemaVersion,
      appVersion: payload.appVersion,
      exportedAt: payload.exportedAt,
      recordCounts: countsFromBackup(payload),
      supported: Number(parsed.schemaVersion) >= 1,
      warnings,
    };
    return { ok: true, payload, summary };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Copia no válida.",
    };
  }
}

function mergeById<T extends IdEntity>(
  current: T[],
  incoming: T[],
): T[] {
  const map = new Map<string, T>();
  for (const item of current) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of incoming) {
    if (!item?.id) continue;
    const existing = map.get(item.id);
    if (!existing) {
      map.set(item.id, item);
      continue;
    }
    const existingTs = existing.updatedAt ?? existing.createdAt ?? "";
    const incomingTs = item.updatedAt ?? item.createdAt ?? "";
    // Prefer the newer record; on tie keep local (current already in map).
    if (incomingTs > existingTs) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function writeMetricArray(keyName: string, entries: unknown[]): void {
  writeJson(storageKey(keyName), entries);
}

function refreshMetrics(): void {
  WeightRepository.refresh();
  BloodPressureRepository.refresh();
  SleepRepository.refresh();
  StepsRepository.refresh();
  MeasurementRepository.refresh();
}

/**
 * Apply a validated backup. Never called automatically — UI must confirm mode.
 */
export function applyBackup(
  payload: TrazaBackupPayload,
  mode: RestoreMode,
): { mode: RestoreMode; recordCounts: BackupRecordCounts } {
  if (mode === "replace") {
    writeMetricArray("weight_entries", payload.weightEntries);
    writeMetricArray("blood_pressure_entries", payload.bloodPressureEntries);
    writeMetricArray("sleep_entries", payload.sleepEntries);
    writeMetricArray("step_entries", payload.stepEntries);
    writeMetricArray("body_measurements", payload.bodyMeasurements);
    writeMetricArray("workout_sessions", payload.workoutSessions);
    writeMetricArray("workout_templates", payload.workoutTemplates);
    ExerciseRepository.replaceAll(payload.exercises);
    RoutineRepository.replaceAll(payload.routines, payload.routineVersions);
    settingsStorage.update(payload.settings);
    setProgressPeriod(payload.progressPeriod);
  } else {
    // Merge — union by id, newer updatedAt wins; never invent new ids.
    writeMetricArray(
      "weight_entries",
      mergeById(WeightRepository.getAll(), payload.weightEntries),
    );
    writeMetricArray(
      "blood_pressure_entries",
      mergeById(
        BloodPressureRepository.getAll(),
        payload.bloodPressureEntries,
      ),
    );
    writeMetricArray(
      "sleep_entries",
      mergeById(SleepRepository.getAll(), payload.sleepEntries),
    );
    writeMetricArray(
      "step_entries",
      mergeById(StepsRepository.getAll(), payload.stepEntries),
    );
    writeMetricArray(
      "body_measurements",
      mergeById(MeasurementRepository.getAll(), payload.bodyMeasurements),
    );

    const currentSessions = readJson<IdEntity[]>(
      storageKey("workout_sessions"),
      [],
    );
    writeMetricArray(
      "workout_sessions",
      mergeById(currentSessions, payload.workoutSessions),
    );

    const currentTemplates = readJson<IdEntity[]>(
      storageKey("workout_templates"),
      [],
    );
    writeMetricArray(
      "workout_templates",
      mergeById(currentTemplates, payload.workoutTemplates),
    );

    ExerciseRepository.replaceAll(
      mergeById(ExerciseRepository.getAll(), payload.exercises) as typeof payload.exercises,
    );
    RoutineRepository.replaceAll(
      mergeById(RoutineRepository.getAll(), payload.routines) as typeof payload.routines,
      mergeById(
        RoutineRepository.getAllVersions(),
        payload.routineVersions,
      ) as typeof payload.routineVersions,
    );

    // Settings: fill blanks from backup, keep local displayName if set
    const local = settingsStorage.get();
    settingsStorage.update({
      ...payload.settings,
      displayName: local.displayName || payload.settings.displayName,
    });
  }

  refreshMetrics();
  ExerciseRepository.refresh();
  RoutineRepository.refresh();
  markBackupDone();

  return {
    mode,
    recordCounts: countsFromBackup(payload),
  };
}

export function backupCompatibilityNote(): string {
  return `TRAZA ${APP_VERSION} · schemaVersion ${TRAZA_EXPORT_SCHEMA_VERSION}`;
}
