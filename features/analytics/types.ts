import type {
  DistributionBucket,
  TrendResult,
} from "./core/types";
import type {
  PeriodAverages,
  PeriodDeltas,
  PeriodTrends,
  SnapshotDeltaPeriod,
  SnapshotTrendPeriod,
  WithPeriodAccessors,
} from "./core/period";
import type { BloodPressureCategoryId } from "@/features/blood-pressure/BloodPressureTypes";
import type { PersonalRecordResult } from "@/features/workout/WorkoutTypes";

/**
 * Shared scalar time-series metric pack (weight, body fat, measurements).
 * Period bags are the source of truth; use `.delta("7d")` / `.average("30d")` /
 * `.trend("90d")` accessors (methods are omitted from JSON.stringify).
 */
export type ScalarSeriesMetrics = WithPeriodAccessors<{
  count: number;
  first: number | null;
  last: number | null;
  /** Calendar date of the latest sample. */
  lastDate: string | null;
  min: number | null;
  max: number | null;
  /** Lifetime mean — same as averages.all. */
  mean: number | null;
  deltas: PeriodDeltas;
  averages: PeriodAverages;
  trends: PeriodTrends;
  isImproving: boolean | null;
}>;

export type WeightAnalyticsResult = ScalarSeriesMetrics;

export type BodyFatAnalyticsResult = ScalarSeriesMetrics;

export type BloodPressureReading = {
  entryDate: string;
  entryTime: string;
  systolic: number;
  diastolic: number;
  pulse: number;
};

/** Scalar period pack for one BP channel (systolic / diastolic / pulse). */
export type BloodPressureChannelMetrics = WithPeriodAccessors<{
  deltas: PeriodDeltas;
  averages: PeriodAverages;
  trends: PeriodTrends;
}>;

export type BloodPressureAnalyticsResult = {
  count: number;
  last: BloodPressureReading | null;
  meanSystolic: number | null;
  meanDiastolic: number | null;
  meanPulse: number | null;
  categoryDistribution: DistributionBucket<BloodPressureCategoryId>[];
  systolic: BloodPressureChannelMetrics;
  diastolic: BloodPressureChannelMetrics;
  pulse: BloodPressureChannelMetrics;
  /** Lifetime systolic trend (alias of systolic.trends.all). */
  systolicTrend: TrendResult | null;
  /** Lifetime diastolic trend (alias of diastolic.trends.all). */
  diastolicTrend: TrendResult | null;
  isImproving: boolean | null;
};

export type SleepNightExtreme = {
  entryDate: string;
  durationMinutes: number;
  score: number | null;
};

export type SleepChannelMetrics = WithPeriodAccessors<{
  deltas: PeriodDeltas;
  averages: PeriodAverages;
  trends: PeriodTrends;
}>;

export type SleepAnalyticsResult = {
  count: number;
  /** Most recent night (by entryDate). */
  lastNight: SleepNightExtreme | null;
  meanDurationMinutes: number | null;
  meanScore: number | null;
  bestNight: SleepNightExtreme | null;
  worstNight: SleepNightExtreme | null;
  /** Duration (minutes) period metrics. */
  duration: SleepChannelMetrics;
  /** Score period metrics (entries without score are skipped). */
  score: SleepChannelMetrics;
};

export type StepsDaySummary = {
  entryDate: string;
  totalSteps: number;
};

export type StepsAnalyticsResult = WithPeriodAccessors<{
  dayCount: number;
  /** Most recent day with steps logged. */
  lastDay: StepsDaySummary | null;
  dailyMean: number | null;
  dailyMax: number | null;
  dailyMin: number | null;
  goal: number;
  goalMetRatio: number | null;
  currentGoalStreak: number;
  bestGoalStreak: number;
  deltas: PeriodDeltas;
  averages: PeriodAverages;
  trends: PeriodTrends;
}>;

export type MeasurementMetricAnalytics = ScalarSeriesMetrics & {
  metric: "waistCm" | "armCm" | "legCm";
};

export type BodyMeasurementsAnalyticsResult = {
  count: number;
  waist: MeasurementMetricAnalytics | null;
  arm: MeasurementMetricAnalytics | null;
  leg: MeasurementMetricAnalytics | null;
};

export type MostPerformedExercise = {
  exerciseId: string;
  nameEs: string;
  sessionCount: number;
  setCount: number;
};

export type ExercisePersonalRecords = {
  exerciseId: string;
  nameEs: string;
  records: PersonalRecordResult[];
};

export type WorkoutAnalyticsResult = {
  totalWorkouts: number;
  workoutsPerWeek: number | null;
  meanDurationMinutes: number | null;
  totalVolumeKg: number;
  weeklyVolumeKg: number;
  totalSets: number;
  distinctExercises: number;
  mostPerformedExercise: MostPerformedExercise | null;
  /**
   * All-time PRs per exercise (max_load / max_reps / max_volume).
   * Empty when no finished sets exist. Single source for Progress / Insights.
   */
  personalRecords: ExercisePersonalRecords[];
};

export type CrossCuttingStreaks = {
  weightLoggingDays: number;
  sleepLoggingDays: number;
  stepsGoalDays: number;
  trainingWeeks: number;
};

/** Full derived snapshot — single source of truth for consumers. */
export type AnalyticsSnapshot = {
  computedAt: string;
  asOfDate: string;
  weight: WeightAnalyticsResult;
  bodyFat: BodyFatAnalyticsResult;
  bloodPressure: BloodPressureAnalyticsResult;
  sleep: SleepAnalyticsResult;
  steps: StepsAnalyticsResult;
  measurements: BodyMeasurementsAnalyticsResult;
  workout: WorkoutAnalyticsResult;
  streaks: CrossCuttingStreaks;
};

/** Re-export period accessor param types for consumers. */
export type { SnapshotDeltaPeriod, SnapshotTrendPeriod };
