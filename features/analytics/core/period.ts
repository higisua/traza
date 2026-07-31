/**
 * Analytics period API.
 *
 * Consumers should prefer period bags + accessors:
 *   snapshot.weight.delta("7d")
 *   snapshot.steps.average("30d")
 *   snapshot.sleep.duration.trend("90d")
 *
 * Snapshot domains precompute common windows so Progress / Insights / AI
 * never recalculate deltas or trends.
 */

import type { DeltaResult, TimedValue, TrendResult } from "./types";
import { mean } from "./stats";
import {
  addCalendarDays,
  latestValue,
  spanDelta,
  valueAtOrBefore,
  windowDelta,
} from "./series";
import { trendFromTimed } from "./trend";

/**
 * Supported analysis windows.
 * - `7d` / `30d` / `90d`: rolling calendar days ending at asOfDate
 * - `all`: full available history (span / lifetime)
 */
export type AnalyticsPeriod = "7d" | "30d" | "90d" | "all";

/** Periods stored on every snapshot for deltas and averages. */
export const SNAPSHOT_DELTA_PERIODS = ["7d", "30d", "90d", "all"] as const;
export type SnapshotDeltaPeriod = (typeof SNAPSHOT_DELTA_PERIODS)[number];

/** Periods stored on every snapshot for trends (incl. lifetime). */
export const SNAPSHOT_TREND_PERIODS = ["7d", "30d", "90d", "all"] as const;
export type SnapshotTrendPeriod = (typeof SNAPSHOT_TREND_PERIODS)[number];

/** Rolling day windows only (excludes `all`). */
export const ROLLING_PERIODS = ["7d", "30d", "90d"] as const;
export type RollingPeriod = (typeof ROLLING_PERIODS)[number];

export type PeriodDeltas = Record<SnapshotDeltaPeriod, DeltaResult | null>;
export type PeriodAverages = Record<SnapshotDeltaPeriod, number | null>;
export type PeriodTrends = Record<SnapshotTrendPeriod, TrendResult | null>;

/** Uniform period metric bag — precomputed on scalar domains. */
export type PeriodMetricBag = {
  deltas: PeriodDeltas;
  averages: PeriodAverages;
  trends: PeriodTrends;
};

export function periodDays(period: AnalyticsPeriod): number | null {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "all":
      return null;
  }
}

export function emptyPeriodDeltas(): PeriodDeltas {
  return { "7d": null, "30d": null, "90d": null, all: null };
}

export function emptyPeriodAverages(): PeriodAverages {
  return { "7d": null, "30d": null, "90d": null, all: null };
}

export function emptyPeriodTrends(): PeriodTrends {
  return { "7d": null, "30d": null, "90d": null, all: null };
}

export function emptyPeriodMetrics(): PeriodMetricBag {
  return {
    deltas: emptyPeriodDeltas(),
    averages: emptyPeriodAverages(),
    trends: emptyPeriodTrends(),
  };
}

/**
 * Points on or after (asOf − windowDays) and on or before asOf.
 * For `all`, returns the full series (optionally clipped to asOf).
 */
export function pointsInPeriod(
  points: readonly TimedValue[],
  period: AnalyticsPeriod,
  asOfDate?: string,
): TimedValue[] {
  if (points.length === 0) return [];
  const asOf = asOfDate ?? points[points.length - 1].date;
  const days = periodDays(period);

  if (days == null) {
    return points.filter((p) => p.date <= asOf);
  }

  const start = addCalendarDays(asOf, -days);
  return points.filter((p) => p.date >= start && p.date <= asOf);
}

/**
 * Mean of values inside the period window.
 */
export function periodAverage(
  points: readonly TimedValue[],
  period: AnalyticsPeriod,
  asOfDate?: string,
): number | null {
  const window = pointsInPeriod(points, period, asOfDate);
  return mean(window.map((p) => p.value));
}

/**
 * Delta of latest vs baseline at period start (`all` = earliest → latest).
 */
export function periodDelta(
  points: readonly TimedValue[],
  period: AnalyticsPeriod,
  asOfDate?: string,
): DeltaResult | null {
  if (period === "all") return spanDelta(points);
  const days = periodDays(period);
  if (days == null) return spanDelta(points);
  return windowDelta(points, days, asOfDate);
}

/**
 * Trend over samples inside the period window.
 */
export function periodTrend(
  points: readonly TimedValue[],
  period: AnalyticsPeriod,
  asOfDate?: string,
  epsilon = 1e-6,
): TrendResult | null {
  return trendFromTimed(pointsInPeriod(points, period, asOfDate), epsilon);
}

/**
 * Precompute the standard period bags from a timed series.
 */
export function computePeriodMetrics(
  points: readonly TimedValue[],
  asOfDate?: string,
  epsilon = 1e-6,
): PeriodMetricBag {
  if (points.length === 0) return emptyPeriodMetrics();

  const deltas = emptyPeriodDeltas();
  const averages = emptyPeriodAverages();
  const trends = emptyPeriodTrends();

  for (const period of SNAPSHOT_DELTA_PERIODS) {
    deltas[period] = periodDelta(points, period, asOfDate);
    averages[period] = periodAverage(points, period, asOfDate);
  }

  for (const period of SNAPSHOT_TREND_PERIODS) {
    trends[period] = periodTrend(points, period, asOfDate, epsilon);
  }

  return { deltas, averages, trends };
}

/**
 * Attach pleasant accessors onto a period bag (methods omitted from JSON).
 *
 *   bag.delta("7d") / bag.average("30d") / bag.trend("90d")
 */
export type WithPeriodAccessors<T extends PeriodMetricBag = PeriodMetricBag> =
  T & {
    delta(period: SnapshotDeltaPeriod): DeltaResult | null;
    average(period: SnapshotDeltaPeriod): number | null;
    trend(period: SnapshotTrendPeriod): TrendResult | null;
  };

export function withPeriodAccessors<T extends PeriodMetricBag>(
  bag: T,
): WithPeriodAccessors<T> {
  const accessors = {
    delta(period: SnapshotDeltaPeriod): DeltaResult | null {
      return bag.deltas[period];
    },
    average(period: SnapshotDeltaPeriod): number | null {
      return bag.averages[period];
    },
    trend(period: SnapshotTrendPeriod): TrendResult | null {
      return bag.trends[period];
    },
  };
  return Object.assign(bag, accessors);
}

/**
 * Latest reading value paired with its date (for snapshot completeness).
 */
export function latestTimed(
  points: readonly TimedValue[],
): TimedValue | null {
  return points.length > 0 ? points[points.length - 1] : null;
}

/**
 * Value at period baseline date (asOf − days), for callers that need the raw baseline.
 */
export function baselineValue(
  points: readonly TimedValue[],
  period: RollingPeriod,
  asOfDate?: string,
): number | null {
  if (points.length === 0) return null;
  const asOf = asOfDate ?? points[points.length - 1].date;
  const days = periodDays(period);
  if (days == null) return null;
  return valueAtOrBefore(points, addCalendarDays(asOf, -days));
}

export { latestValue };
