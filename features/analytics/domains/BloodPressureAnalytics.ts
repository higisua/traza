import { classifyBloodPressure } from "@/features/blood-pressure/BloodPressureFormat";
import type { BloodPressureEntry } from "@/features/blood-pressure/BloodPressureTypes";
import type { BloodPressureCategoryId } from "@/features/blood-pressure/BloodPressureTypes";
import {
  computePeriodMetrics,
  distribution,
  emptyPeriodMetrics,
  isImproving,
  last,
  mean,
  toTimedSeries,
  withPeriodAccessors,
} from "../core";
import type {
  BloodPressureAnalyticsResult,
  BloodPressureChannelMetrics,
  BloodPressureReading,
} from "../types";

function channelMetrics(
  entries: readonly BloodPressureEntry[],
  getValue: (e: BloodPressureEntry) => number | null | undefined,
  asOfDate: string | undefined,
  epsilon: number,
): BloodPressureChannelMetrics {
  const series = toTimedSeries(entries, (e) => e.entryDate, getValue);
  if (series.length === 0) {
    return withPeriodAccessors(emptyPeriodMetrics());
  }
  return withPeriodAccessors(computePeriodMetrics(series, asOfDate, epsilon));
}

function toReading(entry: BloodPressureEntry): BloodPressureReading {
  return {
    entryDate: entry.entryDate,
    entryTime: entry.entryTime,
    systolic: entry.systolic,
    diastolic: entry.diastolic,
    pulse: entry.pulse,
  };
}

/**
 * Blood-pressure aggregates: last reading, period deltas/trends per channel,
 * category distribution, and composite improvement flag.
 */
export function analyzeBloodPressure(
  entries: readonly BloodPressureEntry[],
  asOfDate?: string,
): BloodPressureAnalyticsResult {
  const sorted = [...entries].sort((a, b) => {
    const byDate = a.entryDate.localeCompare(b.entryDate);
    if (byDate !== 0) return byDate;
    return a.occurredAt.localeCompare(b.occurredAt);
  });

  const systolic = entries.map((e) => e.systolic);
  const diastolic = entries.map((e) => e.diastolic);
  const pulseValues = entries
    .map((e) => e.pulse)
    .filter((p) => Number.isFinite(p) && p > 0);

  const categories = entries.map(
    (e) => classifyBloodPressure(e.systolic, e.diastolic).id,
  );

  const systolicMetrics = channelMetrics(
    entries,
    (e) => e.systolic,
    asOfDate,
    0.5,
  );
  const diastolicMetrics = channelMetrics(
    entries,
    (e) => e.diastolic,
    asOfDate,
    0.5,
  );
  const pulseMetrics = channelMetrics(
    entries,
    (e) => (e.pulse > 0 ? e.pulse : null),
    asOfDate,
    0.5,
  );

  const systolicTrend = systolicMetrics.trends.all;
  const diastolicTrend = diastolicMetrics.trends.all;

  // Improvement = both trends non-worsening and at least one improving,
  // or systolic improving when diastolic is flat.
  const sysImproving = isImproving(systolicTrend, "lower_is_better");
  const diaImproving = isImproving(diastolicTrend, "lower_is_better");
  let improving: boolean | null = null;
  if (sysImproving !== null || diaImproving !== null) {
    const sysWorse = systolicTrend?.direction === "up";
    const diaWorse = diastolicTrend?.direction === "up";
    if (sysWorse || diaWorse) improving = false;
    else if (sysImproving || diaImproving) improving = true;
    else improving = false;
  }

  const lastEntry = last(sorted);

  return {
    count: entries.length,
    last: lastEntry ? toReading(lastEntry) : null,
    meanSystolic: mean(systolic),
    meanDiastolic: mean(diastolic),
    meanPulse: mean(pulseValues),
    categoryDistribution: distribution(
      categories as BloodPressureCategoryId[],
    ),
    systolic: systolicMetrics,
    diastolic: diastolicMetrics,
    pulse: pulseMetrics,
    systolicTrend,
    diastolicTrend,
    isImproving: improving,
  };
}
