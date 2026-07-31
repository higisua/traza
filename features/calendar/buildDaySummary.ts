import {
  formatBloodPressureReading,
  formatPulse,
  type BloodPressureEntry,
} from "@/features/blood-pressure";
import {
  formatCm,
  type MeasurementEntry,
} from "@/features/measurements";
import {
  formatSleepDurationShort,
  formatSleepScore,
  type SleepEntry,
} from "@/features/sleep";
import {
  buildDayProgress,
  formatStepsCount,
  type StepsEntry,
} from "@/features/steps";
import {
  formatBodyFatPct,
  formatWeightKg,
  type WeightEntry,
} from "@/features/weight";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";
import {
  CALENDAR_MODULES,
  type CalendarModuleKey,
  type DaySummaryBlock,
  type SelectedDayHeading,
} from "./CalendarTypes";

const MODULE_LABEL: Record<CalendarModuleKey, string> = {
  weight: "Peso",
  bloodPressure: "Tensión",
  sleep: "Sueño",
  steps: "Pasos",
  measurements: "Medición",
  training: "Entrenamiento",
};

const MODULE_HREF: Record<CalendarModuleKey, string | null> = {
  weight: "/weight",
  bloodPressure: "/blood-pressure",
  sleep: "/sleep",
  steps: "/steps",
  measurements: "/measurements",
  /** Training module route not product-ready — prepare intent only. */
  training: null,
};

export type DaySummarySources = {
  weight: readonly WeightEntry[];
  bloodPressure: readonly BloodPressureEntry[];
  sleep: readonly SleepEntry[];
  steps: readonly StepsEntry[];
  measurements: readonly MeasurementEntry[];
  training: readonly WorkoutSession[];
};

type ModuleLines = {
  primary: string | null;
  secondary: string | null;
};

function latestByTime<T extends { entryTime: string; occurredAt: string }>(
  entries: readonly T[],
): T | null {
  if (entries.length === 0) return null;
  return [...entries].sort((a, b) => {
    const byOccurred = a.occurredAt.localeCompare(b.occurredAt);
    if (byOccurred !== 0) return byOccurred;
    return a.entryTime.localeCompare(b.entryTime);
  })[entries.length - 1]!;
}

function formatWeightLines(entries: readonly WeightEntry[]): ModuleLines {
  const entry = latestByTime(entries);
  if (!entry) return { primary: null, secondary: null };
  return {
    primary: `${formatWeightKg(entry.weightKg)} kg`,
    secondary:
      entry.bodyFatPct !== null
        ? `${formatBodyFatPct(entry.bodyFatPct)} % grasa`
        : null,
  };
}

function formatBloodPressureLines(
  entries: readonly BloodPressureEntry[],
): ModuleLines {
  const entry = latestByTime(entries);
  if (!entry) return { primary: null, secondary: null };
  return {
    primary: formatBloodPressureReading(entry.systolic, entry.diastolic),
    secondary: formatPulse(entry.pulse),
  };
}

function formatSleepLines(entries: readonly SleepEntry[]): ModuleLines {
  const entry = latestByTime(entries);
  if (!entry) return { primary: null, secondary: null };
  return {
    primary: formatSleepDurationShort(entry.durationMinutes),
    secondary: entry.score !== null ? formatSleepScore(entry.score) : null,
  };
}

function formatStepsLines(
  date: string,
  entries: readonly StepsEntry[],
): ModuleLines {
  if (entries.length === 0) return { primary: null, secondary: null };
  const total = entries.reduce((sum, e) => sum + e.steps, 0);
  const progress = buildDayProgress(date, total);
  return {
    primary: formatStepsCount(progress.totalSteps),
    secondary: progress.goalReached ? "Objetivo conseguido" : "En progreso",
  };
}

function formatMeasurementsLines(
  entries: readonly MeasurementEntry[],
): ModuleLines {
  const entry = latestByTime(entries);
  if (!entry) return { primary: null, secondary: null };
  return {
    primary: `${formatCm(entry.waistCm)} · ${formatCm(entry.armCm)} · ${formatCm(entry.legCm)}`,
    secondary: null,
  };
}

function formatTrainingLines(
  sessions: readonly WorkoutSession[],
): ModuleLines {
  const active = sessions.filter((s) => s.status !== "cancelled");
  if (active.length === 0) return { primary: null, secondary: null };

  const completed = active.filter((s) => s.status === "completed");
  if (completed.length === 1 && completed[0]!.durationMinutes != null) {
    return {
      primary: `${completed[0]!.durationMinutes} min`,
      secondary: null,
    };
  }
  if (completed.length === 1) {
    return { primary: "Sesión completada", secondary: null };
  }
  if (completed.length > 1) {
    return { primary: `${completed.length} sesiones`, secondary: null };
  }

  const inProgress = active.some((s) => s.status === "in_progress");
  if (inProgress) return { primary: "En curso", secondary: null };

  return { primary: "Registrado", secondary: null };
}

function block(
  module: CalendarModuleKey,
  lines: ModuleLines,
): DaySummaryBlock {
  return {
    module,
    label: MODULE_LABEL[module],
    primary: lines.primary,
    secondary: lines.secondary,
    recorded: lines.primary !== null,
    href: MODULE_HREF[module],
  };
}

/**
 * Pure day summary for a YYYY-MM-DD date.
 * Does not copy domain models — filters and formats only.
 */
export function buildDaySummary(
  date: string,
  sources: DaySummarySources,
): DaySummaryBlock[] {
  const weight = sources.weight.filter((e) => e.entryDate === date);
  const bloodPressure = sources.bloodPressure.filter(
    (e) => e.entryDate === date,
  );
  const sleep = sources.sleep.filter((e) => e.entryDate === date);
  const steps = sources.steps.filter((e) => e.entryDate === date);
  const measurements = sources.measurements.filter((e) => e.entryDate === date);
  const training = sources.training.filter((s) => s.sessionDate === date);

  const values: Record<CalendarModuleKey, ModuleLines> = {
    weight: formatWeightLines(weight),
    bloodPressure: formatBloodPressureLines(bloodPressure),
    sleep: formatSleepLines(sleep),
    steps: formatStepsLines(date, steps),
    measurements: formatMeasurementsLines(measurements),
    training: formatTrainingLines(training),
  };

  return CALENDAR_MODULES.map((module) => block(module, values[module]));
}

export function formatSelectedDayHeading(date: string): SelectedDayHeading {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) {
    return { weekday: "", dateLabel: date };
  }
  const dt = new Date(y, m - 1, d);
  const weekdayRaw = dt.toLocaleDateString("es-ES", { weekday: "long" });
  const month = dt.toLocaleDateString("es-ES", { month: "long" });
  return {
    weekday: weekdayRaw.charAt(0).toUpperCase() + weekdayRaw.slice(1),
    dateLabel: `${d} ${month}`,
  };
}
