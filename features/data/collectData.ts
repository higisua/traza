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
import { getProgressPeriod } from "@/features/progress/ProgressPeriodStore";
import { AnalyticsService } from "@/features/analytics/AnalyticsService";
import { InsightsService } from "@/features/insights/InsightsService";
import type { AnalyticsSnapshot } from "@/features/analytics";
import type { InsightsResult } from "@/features/insights";
import type { WeightEntry } from "@/features/weight/WeightTypes";
import type { BloodPressureEntry } from "@/features/blood-pressure/BloodPressureTypes";
import type { SleepEntry } from "@/features/sleep/SleepTypes";
import type { StepsEntry } from "@/features/steps/StepsTypes";
import type { MeasurementEntry } from "@/features/measurements/MeasurementTypes";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";
import type { Exercise } from "@/features/exercises/exerciseTypes";
import type {
  DateRange,
  ExportContentKey,
  TrazaBackupPayload,
} from "./schema";
import {
  APP_VERSION,
  TRAZA_EXPORT_SCHEMA_VERSION,
} from "./schema";
import { isDateInRange } from "./period";

export type CollectedLiveData = {
  weightEntries: WeightEntry[];
  bloodPressureEntries: BloodPressureEntry[];
  sleepEntries: SleepEntry[];
  stepEntries: StepsEntry[];
  bodyMeasurements: MeasurementEntry[];
  workoutSessions: WorkoutSession[];
  exercises: Exercise[];
};

export function collectLiveData(): CollectedLiveData {
  return {
    weightEntries: WeightRepository.getAll(),
    bloodPressureEntries: BloodPressureRepository.getAll(),
    sleepEntries: SleepRepository.getAll(),
    stepEntries: StepsRepository.getAll(),
    bodyMeasurements: MeasurementRepository.getAll(),
    workoutSessions: WorkoutRepository.getSessions(),
    exercises: ExerciseRepository.getAll(),
  };
}

export function filterByRange(
  data: CollectedLiveData,
  range: DateRange,
): CollectedLiveData {
  return {
    weightEntries: data.weightEntries.filter((e) =>
      isDateInRange(e.entryDate, range),
    ),
    bloodPressureEntries: data.bloodPressureEntries.filter((e) =>
      isDateInRange(e.entryDate, range),
    ),
    sleepEntries: data.sleepEntries.filter((e) =>
      isDateInRange(e.entryDate, range),
    ),
    stepEntries: data.stepEntries.filter((e) =>
      isDateInRange(e.entryDate, range),
    ),
    bodyMeasurements: data.bodyMeasurements.filter((e) =>
      isDateInRange(e.entryDate, range),
    ),
    workoutSessions: data.workoutSessions.filter((e) =>
      isDateInRange(e.sessionDate, range),
    ),
    exercises: data.exercises,
  };
}

export function buildFullBackup(options?: {
  includeDerived?: boolean;
}): TrazaBackupPayload {
  const live = collectLiveData();
  const includeDerived = options?.includeDerived ?? true;

  let analyticsSnapshot: AnalyticsSnapshot | undefined;
  let insightsSnapshot: InsightsResult | undefined;

  if (includeDerived) {
    analyticsSnapshot = AnalyticsService.compute({
      weight: live.weightEntries,
      bloodPressure: live.bloodPressureEntries,
      sleep: live.sleepEntries,
      steps: live.stepEntries,
      measurements: live.bodyMeasurements,
      workouts: live.workoutSessions,
    });
    insightsSnapshot = InsightsService.fromSnapshot(analyticsSnapshot);
  }

  return {
    schemaVersion: TRAZA_EXPORT_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    kind: "full_backup",
    settings: settingsStorage.get(),
    progressPeriod: getProgressPeriod(),
    weightEntries: live.weightEntries,
    bloodPressureEntries: live.bloodPressureEntries,
    sleepEntries: live.sleepEntries,
    stepEntries: live.stepEntries,
    bodyMeasurements: live.bodyMeasurements,
    workoutSessions: live.workoutSessions,
    workoutTemplates: trainingStorage.getTemplates(),
    exercises: live.exercises,
    routines: RoutineRepository.getAll(),
    routineVersions: RoutineRepository.getAllVersions(),
    ...(analyticsSnapshot
      ? { analyticsSnapshot: serializeSnapshot(analyticsSnapshot) }
      : {}),
    ...(insightsSnapshot ? { insightsSnapshot } : {}),
  };
}

/** Strip non-enumerable period accessor methods for JSON. */
function serializeSnapshot(snapshot: AnalyticsSnapshot): unknown {
  return JSON.parse(JSON.stringify(snapshot));
}

export function contentSelectionActive(
  selected: ReadonlySet<ExportContentKey>,
  key: ExportContentKey,
): boolean {
  return selected.has(key);
}

export function exerciseNameMap(
  exercises: readonly Exercise[],
): Map<string, string> {
  const map = new Map<string, string>();
  for (const exercise of exercises) {
    map.set(exercise.slug, exercise.nameEs || exercise.name);
    map.set(exercise.id, exercise.nameEs || exercise.name);
  }
  return map;
}
