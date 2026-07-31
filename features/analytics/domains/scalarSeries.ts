import type { TrendPolarity } from "../core/types";
import {
  computePeriodMetrics,
  earliestValue,
  isImproving,
  latestTimed,
  latestValue,
  max,
  mean,
  min,
  toTimedSeries,
  withPeriodAccessors,
} from "../core";
import type { ScalarSeriesMetrics } from "../types";

/**
 * Build the standard scalar pack (last/first/min/max/mean/period bags)
 * from raw entries. `getValue` may return null to skip a sample.
 */
export function computeScalarSeriesMetrics<T>(
  entries: readonly T[],
  getDate: (entry: T) => string,
  getValue: (entry: T) => number | null | undefined,
  polarity: TrendPolarity,
  asOfDate?: string,
  epsilon = 1e-6,
): ScalarSeriesMetrics {
  const series = toTimedSeries(entries, getDate, getValue);
  const values = series.map((p) => p.value);
  const periods = computePeriodMetrics(series, asOfDate, epsilon);
  const lastPoint = latestTimed(series);

  return withPeriodAccessors({
    count: series.length,
    first: earliestValue(series),
    last: latestValue(series),
    lastDate: lastPoint?.date ?? null,
    min: min(values),
    max: max(values),
    mean: mean(values),
    deltas: periods.deltas,
    averages: periods.averages,
    trends: periods.trends,
    isImproving: isImproving(periods.trends.all, polarity),
  });
}
