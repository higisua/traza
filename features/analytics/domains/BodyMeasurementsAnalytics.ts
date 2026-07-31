import type { MeasurementEntry } from "@/features/measurements/MeasurementTypes";
import type { TrendPolarity } from "../core/types";
import { computeScalarSeriesMetrics } from "./scalarSeries";
import type {
  BodyMeasurementsAnalyticsResult,
  MeasurementMetricAnalytics,
} from "../types";

type MetricKey = "waistCm" | "armCm" | "legCm";

const POLARITY: Record<MetricKey, TrendPolarity> = {
  // Smaller waist is typically desirable; arm/leg growth often means muscle.
  waistCm: "lower_is_better",
  armCm: "higher_is_better",
  legCm: "higher_is_better",
};

function analyzeMetric(
  entries: readonly MeasurementEntry[],
  metric: MetricKey,
  asOfDate?: string,
): MeasurementMetricAnalytics | null {
  if (entries.length === 0) return null;

  const base = computeScalarSeriesMetrics(
    entries,
    (e) => e.entryDate,
    (e) => e[metric],
    POLARITY[metric],
    asOfDate,
    0.05,
  );

  return {
    ...base,
    metric,
  };
}

export function analyzeBodyMeasurements(
  entries: readonly MeasurementEntry[],
  asOfDate?: string,
): BodyMeasurementsAnalyticsResult {
  return {
    count: entries.length,
    waist: analyzeMetric(entries, "waistCm", asOfDate),
    arm: analyzeMetric(entries, "armCm", asOfDate),
    leg: analyzeMetric(entries, "legCm", asOfDate),
  };
}
