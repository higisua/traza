import { addDays, format } from "date-fns";
import type { TimedValue } from "./types";
import { deltaOrNull } from "./delta";
import type { DeltaResult } from "./types";

/**
 * Sort timed values ascending by date (stable for equal dates by keeping order).
 */
export function sortTimedAsc(points: readonly TimedValue[]): TimedValue[] {
  return [...points].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Map repository entries (newest-first) into ascending TimedValue series.
 */
export function toTimedSeries<T>(
  entries: readonly T[],
  getDate: (entry: T) => string,
  getValue: (entry: T) => number | null | undefined,
): TimedValue[] {
  const out: TimedValue[] = [];
  for (const entry of entries) {
    const value = getValue(entry);
    if (value == null || !Number.isFinite(value)) continue;
    out.push({ date: getDate(entry), value });
  }
  return sortTimedAsc(out);
}

/**
 * Last value on or before `targetDate`. Assumes ascending order.
 * O(n) scan — fine for years of daily data; binary search ready later.
 */
export function valueAtOrBefore(
  points: readonly TimedValue[],
  targetDate: string,
): number | null {
  let found: number | null = null;
  for (const point of points) {
    if (point.date > targetDate) break;
    found = point.value;
  }
  return found;
}

/**
 * Newest value in the series (chronological last).
 */
export function latestValue(points: readonly TimedValue[]): number | null {
  return points.length > 0 ? points[points.length - 1].value : null;
}

/**
 * Oldest value in the series.
 */
export function earliestValue(points: readonly TimedValue[]): number | null {
  return points.length > 0 ? points[0].value : null;
}

function shiftDate(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00`);
  return format(addDays(base, days), "yyyy-MM-dd");
}

/**
 * Delta of latest vs value at or before (asOf − windowDays).
 */
export function windowDelta(
  points: readonly TimedValue[],
  windowDays: number,
  asOfDate?: string,
): DeltaResult | null {
  if (points.length === 0) return null;
  const asOf = asOfDate ?? points[points.length - 1].date;
  const baselineDate = shiftDate(asOf, -windowDays);
  const from = valueAtOrBefore(points, baselineDate);
  const to = latestValue(points);
  return deltaOrNull(from, to);
}

/**
 * Delta of latest vs earliest (full span).
 */
export function spanDelta(points: readonly TimedValue[]): DeltaResult | null {
  return deltaOrNull(earliestValue(points), latestValue(points));
}

export { shiftDate as addCalendarDays };
