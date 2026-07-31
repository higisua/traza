import type { SleepEntry } from "@/features/sleep/SleepTypes";
import {
  computePeriodMetrics,
  emptyPeriodMetrics,
  mean,
  toTimedSeries,
  withPeriodAccessors,
} from "../core";
import type {
  SleepAnalyticsResult,
  SleepChannelMetrics,
  SleepNightExtreme,
} from "../types";

function toNight(entry: SleepEntry): SleepNightExtreme {
  return {
    entryDate: entry.entryDate,
    durationMinutes: entry.durationMinutes,
    score: entry.score,
  };
}

function channelFromEntries(
  entries: readonly SleepEntry[],
  getValue: (e: SleepEntry) => number | null | undefined,
  asOfDate: string | undefined,
  epsilon: number,
): SleepChannelMetrics {
  const series = toTimedSeries(entries, (e) => e.entryDate, getValue);
  if (series.length === 0) {
    return withPeriodAccessors(emptyPeriodMetrics());
  }
  return withPeriodAccessors(computePeriodMetrics(series, asOfDate, epsilon));
}

/**
 * Prefer scored quality when present; otherwise rank by duration.
 * Best = highest score, then longest; worst = lowest score, then shortest.
 */
export function analyzeSleep(
  entries: readonly SleepEntry[],
  asOfDate?: string,
): SleepAnalyticsResult {
  const emptyChannels = (): SleepChannelMetrics =>
    withPeriodAccessors(emptyPeriodMetrics());

  if (entries.length === 0) {
    return {
      count: 0,
      lastNight: null,
      meanDurationMinutes: null,
      meanScore: null,
      bestNight: null,
      worstNight: null,
      duration: emptyChannels(),
      score: emptyChannels(),
    };
  }

  const sorted = [...entries].sort((a, b) => {
    const byDate = a.entryDate.localeCompare(b.entryDate);
    if (byDate !== 0) return byDate;
    return a.occurredAt.localeCompare(b.occurredAt);
  });

  const durations = entries.map((e) => e.durationMinutes);
  const scores = entries
    .map((e) => e.score)
    .filter((s): s is number => s != null && Number.isFinite(s));

  let best = entries[0];
  let worst = entries[0];

  for (const entry of entries) {
    if (compareNights(entry, best) > 0) best = entry;
    if (compareNights(entry, worst) < 0) worst = entry;
  }

  return {
    count: entries.length,
    lastNight: toNight(sorted[sorted.length - 1]),
    meanDurationMinutes: mean(durations),
    meanScore: mean(scores),
    bestNight: toNight(best),
    worstNight: toNight(worst),
    duration: channelFromEntries(
      entries,
      (e) => e.durationMinutes,
      asOfDate,
      1,
    ),
    score: channelFromEntries(
      entries,
      (e) => e.score,
      asOfDate,
      0.5,
    ),
  };
}

/** Positive when `a` is better than `b`. */
function compareNights(a: SleepEntry, b: SleepEntry): number {
  const aScore = a.score;
  const bScore = b.score;
  if (aScore != null && bScore != null && aScore !== bScore) {
    return aScore - bScore;
  }
  if (aScore != null && bScore == null) return 1;
  if (aScore == null && bScore != null) return -1;
  return a.durationMinutes - b.durationMinutes;
}
