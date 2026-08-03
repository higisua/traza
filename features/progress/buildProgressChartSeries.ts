import type { AnalyticsPeriod } from "@/features/analytics";
import { addCalendarDays } from "@/features/analytics/core";
import { WeightService, type WeightChartPoint } from "@/features/weight";
import {
  MeasurementService,
  type MeasurementChartPoint,
} from "@/features/measurements";
import { SleepService, type SleepChartPoint } from "@/features/sleep";
import { StepsService, type StepsChartPoint } from "@/features/steps";
import {
  BloodPressureService,
  type BloodPressureChartPoint,
} from "@/features/blood-pressure";
import { WorkoutRepository } from "@/features/workout/WorkoutRepository";
import { sessionVolumeKg } from "@/features/workout/VolumeService";
import { formatChartDayLabel } from "@/lib/tracking/dateTime";
import { chartPointLimit, isDateInPeriod } from "./periodWindow";

export type WeeklyVolumePoint = {
  weekStart: string;
  volumeKg: number;
  label: string;
};

function filterByPeriod<T extends { entryDate: string }>(
  points: readonly T[],
  period: AnalyticsPeriod,
  asOfDate: string,
): T[] {
  return points.filter((p) => isDateInPeriod(p.entryDate, period, asOfDate));
}

function mondayOf(dateYmd: string): string {
  const date = new Date(`${dateYmd}T12:00:00`);
  const day = date.getDay(); // 0 Sun … 6 Sat
  const offset = day === 0 ? -6 : 1 - day;
  return addCalendarDays(dateYmd, offset);
}

/**
 * Chart series for Progress — reuses module chart builders, clipped to period.
 * No analytics recomputation; presentation filtering only.
 */
export function buildProgressChartSeries(
  period: AnalyticsPeriod,
  asOfDate: string,
) {
  const limit = chartPointLimit(period);

  const weight = filterByPeriod(
    WeightService.getChartPoints(limit),
    period,
    asOfDate,
  );
  const measurements = filterByPeriod(
    MeasurementService.getChartPoints(limit),
    period,
    asOfDate,
  );
  const sleep = filterByPeriod(
    SleepService.getChartPoints(Math.max(limit, 14)),
    period,
    asOfDate,
  );
  const steps = filterByPeriod(
    StepsService.getChartPoints(Math.max(limit, 14)),
    period,
    asOfDate,
  );
  const bloodPressure = filterByPeriod(
    BloodPressureService.getChartPoints(limit),
    period,
    asOfDate,
  );

  const weeklyVolume = buildWeeklyVolume(period, asOfDate);

  return {
    weight,
    measurements,
    sleep,
    steps,
    bloodPressure,
    weeklyVolume,
  };
}

export type ProgressChartSeries = ReturnType<typeof buildProgressChartSeries>;

function buildWeeklyVolume(
  period: AnalyticsPeriod,
  asOfDate: string,
): WeeklyVolumePoint[] {
  const sessions = WorkoutRepository.getSessions().filter(
    (s) =>
      (s.status === "completed" || s.status === "partial") &&
      isDateInPeriod(s.sessionDate, period, asOfDate),
  );

  if (sessions.length === 0) return [];

  const byWeek = new Map<string, number>();
  for (const session of sessions) {
    const week = mondayOf(session.sessionDate);
    byWeek.set(week, (byWeek.get(week) ?? 0) + sessionVolumeKg(session));
  }

  let weeks = [...byWeek.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, volumeKg]) => ({
      weekStart,
      volumeKg,
      label: formatChartDayLabel({ entryDate: weekStart }),
    }));

  const maxWeeks =
    period === "7d" ? 2 : period === "30d" ? 5 : period === "90d" ? 13 : 16;
  if (weeks.length > maxWeeks) {
    weeks = weeks.slice(-maxWeeks);
  }

  return weeks;
}

export type {
  WeightChartPoint,
  MeasurementChartPoint,
  SleepChartPoint,
  StepsChartPoint,
  BloodPressureChartPoint,
};
