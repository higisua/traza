export type {
  DeltaResult,
  DistributionBucket,
  TimedValue,
  TrendDirection,
  TrendPolarity,
  TrendResult,
} from "./types";

export { delta, deltaOrNull } from "./delta";
export {
  mean,
  min,
  max,
  first,
  last,
  distribution,
} from "./stats";
export {
  trend,
  trendFromTimed,
  trendDirection,
  isImproving,
  movingAverage,
} from "./trend";
export {
  uniqueSortedDates,
  bestDayStreak,
  currentDayStreak,
  currentWeekStreak,
  bestWeekStreak,
  isoWeekKey,
} from "./streak";
export {
  sortTimedAsc,
  toTimedSeries,
  valueAtOrBefore,
  latestValue,
  earliestValue,
  windowDelta,
  spanDelta,
  addCalendarDays,
} from "./series";
export type {
  AnalyticsPeriod,
  SnapshotDeltaPeriod,
  SnapshotTrendPeriod,
  RollingPeriod,
  PeriodDeltas,
  PeriodAverages,
  PeriodTrends,
  PeriodMetricBag,
  WithPeriodAccessors,
} from "./period";
export {
  SNAPSHOT_DELTA_PERIODS,
  SNAPSHOT_TREND_PERIODS,
  ROLLING_PERIODS,
  periodDays,
  emptyPeriodDeltas,
  emptyPeriodAverages,
  emptyPeriodTrends,
  emptyPeriodMetrics,
  pointsInPeriod,
  periodAverage,
  periodDelta,
  periodTrend,
  computePeriodMetrics,
  withPeriodAccessors,
  latestTimed,
  baselineValue,
} from "./period";
