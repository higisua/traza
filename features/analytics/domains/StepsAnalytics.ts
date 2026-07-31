import type { StepsEntry } from "@/features/steps/StepsTypes";
import { getDailyStepsGoal } from "@/features/steps/StepsGoal";
import {
  bestDayStreak,
  computePeriodMetrics,
  currentDayStreak,
  emptyPeriodMetrics,
  max,
  mean,
  min,
  withPeriodAccessors,
} from "../core";
import type { StepsAnalyticsResult, StepsDaySummary } from "../types";

export type DailyStepsTotal = {
  entryDate: string;
  totalSteps: number;
};

/**
 * Aggregate multiple same-day entries into one daily total (sum).
 * Shared by StepsAnalytics and StreakAnalytics — single aggregation path.
 */
export function aggregateDailySteps(
  entries: readonly StepsEntry[],
): DailyStepsTotal[] {
  const byDate = new Map<string, number>();
  for (const entry of entries) {
    byDate.set(
      entry.entryDate,
      (byDate.get(entry.entryDate) ?? 0) + entry.steps,
    );
  }
  return Array.from(byDate.entries())
    .map(([entryDate, totalSteps]) => ({ entryDate, totalSteps }))
    .sort((a, b) => a.entryDate.localeCompare(b.entryDate));
}

/**
 * Pure steps metrics from already-aggregated daily totals.
 * Prefer this when the caller already ran `aggregateDailySteps`.
 */
export function analyzeStepsFromDaily(
  days: readonly DailyStepsTotal[],
  options?: { goal?: number; asOfDate?: string },
): StepsAnalyticsResult {
  const goal = options?.goal ?? getDailyStepsGoal();
  const totals = days.map((d) => d.totalSteps);
  const goalDates = days
    .filter((d) => d.totalSteps >= goal)
    .map((d) => d.entryDate);

  const series = days.map((d) => ({
    date: d.entryDate,
    value: d.totalSteps,
  }));
  const periods =
    series.length === 0
      ? emptyPeriodMetrics()
      : computePeriodMetrics(series, options?.asOfDate, 50);

  const last = days.length > 0 ? days[days.length - 1] : null;
  const lastDay: StepsDaySummary | null = last
    ? { entryDate: last.entryDate, totalSteps: last.totalSteps }
    : null;

  return withPeriodAccessors({
    dayCount: days.length,
    lastDay,
    dailyMean: mean(totals),
    dailyMax: max(totals),
    dailyMin: min(totals),
    goal,
    goalMetRatio:
      days.length === 0 ? null : goalDates.length / days.length,
    currentGoalStreak: currentDayStreak(goalDates, options?.asOfDate),
    bestGoalStreak: bestDayStreak(goalDates),
    deltas: periods.deltas,
    averages: periods.averages,
    trends: periods.trends,
  });
}

export function analyzeSteps(
  entries: readonly StepsEntry[],
  options?: { goal?: number; asOfDate?: string },
): StepsAnalyticsResult {
  return analyzeStepsFromDaily(aggregateDailySteps(entries), options);
}
