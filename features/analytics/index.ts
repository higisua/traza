export { AnalyticsService } from "./AnalyticsService";
export type { AnalyticsComputeInput } from "./AnalyticsService";

export type {
  AnalyticsSnapshot,
  WeightAnalyticsResult,
  BodyFatAnalyticsResult,
  BloodPressureAnalyticsResult,
  BloodPressureReading,
  BloodPressureChannelMetrics,
  SleepAnalyticsResult,
  SleepNightExtreme,
  SleepChannelMetrics,
  StepsAnalyticsResult,
  StepsDaySummary,
  BodyMeasurementsAnalyticsResult,
  MeasurementMetricAnalytics,
  WorkoutAnalyticsResult,
  MostPerformedExercise,
  ExercisePersonalRecords,
  CrossCuttingStreaks,
  ScalarSeriesMetrics,
  SnapshotDeltaPeriod,
  SnapshotTrendPeriod,
} from "./types";

/** Re-export core helpers so UI/AI layers import from one place. */
export {
  delta,
  deltaOrNull,
  mean,
  min,
  max,
  first,
  last,
  distribution,
  trend,
  trendFromTimed,
  trendDirection,
  isImproving,
  movingAverage,
  currentDayStreak,
  bestDayStreak,
  currentWeekStreak,
  bestWeekStreak,
  // Period API
  SNAPSHOT_DELTA_PERIODS,
  SNAPSHOT_TREND_PERIODS,
  ROLLING_PERIODS,
  periodDays,
  computePeriodMetrics,
  withPeriodAccessors,
  periodDelta,
  periodAverage,
  periodTrend,
  pointsInPeriod,
} from "./core";

export type {
  DeltaResult,
  TimedValue,
  TrendDirection,
  TrendPolarity,
  TrendResult,
  DistributionBucket,
  AnalyticsPeriod,
  PeriodDeltas,
  PeriodAverages,
  PeriodTrends,
  PeriodMetricBag,
  WithPeriodAccessors,
  RollingPeriod,
} from "./core";

export { analyzeWeight } from "./domains/WeightAnalytics";
export { analyzeBodyFat } from "./domains/BodyFatAnalytics";
export { analyzeBloodPressure } from "./domains/BloodPressureAnalytics";
export { analyzeSleep } from "./domains/SleepAnalytics";
export {
  analyzeSteps,
  analyzeStepsFromDaily,
  aggregateDailySteps,
} from "./domains/StepsAnalytics";
export type { DailyStepsTotal } from "./domains/StepsAnalytics";
export { analyzeBodyMeasurements } from "./domains/BodyMeasurementsAnalytics";
export { analyzeWorkouts } from "./domains/WorkoutAnalytics";
export { analyzeCrossCuttingStreaks } from "./domains/StreakAnalytics";
