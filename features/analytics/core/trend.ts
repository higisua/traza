import type { TimedValue, TrendDirection, TrendPolarity, TrendResult } from "./types";
import { delta } from "./delta";

const DEFAULT_EPSILON = 1e-6;

export function trendDirection(
  change: number,
  epsilon = DEFAULT_EPSILON,
): TrendDirection {
  if (Math.abs(change) <= epsilon) return "flat";
  return change > 0 ? "up" : "down";
}

/**
 * Simple end-to-end trend over a chronologically ordered series (oldest → newest).
 * Slope is change / (n − 1) when n ≥ 2 (average step change).
 */
export function trend(
  values: readonly number[],
  epsilon = DEFAULT_EPSILON,
): TrendResult | null {
  if (values.length === 0) return null;
  if (values.length === 1) {
    return {
      direction: "flat",
      slope: 0,
      change: 0,
      sampleCount: 1,
    };
  }

  const first = values[0];
  const last = values[values.length - 1];
  const change = last - first;
  const slope = change / (values.length - 1);

  return {
    direction: trendDirection(change, epsilon),
    slope,
    change,
    sampleCount: values.length,
  };
}

/**
 * Linear least-squares slope over timed values (oldest → newest).
 * X axis = day index from the first sample. Falls back to end-to-end when < 2 points.
 */
export function trendFromTimed(
  points: readonly TimedValue[],
  epsilon = DEFAULT_EPSILON,
): TrendResult | null {
  if (points.length === 0) return null;
  if (points.length === 1) {
    return {
      direction: "flat",
      slope: 0,
      change: 0,
      sampleCount: 1,
    };
  }

  const xs = points.map((_, i) => i);
  const ys = points.map((p) => p.value);
  const n = points.length;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumXX += xs[i] * xs[i];
  }

  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const change = ys[n - 1] - ys[0];

  return {
    direction: trendDirection(slope, epsilon),
    slope,
    change,
    sampleCount: n,
  };
}

/**
 * Whether the observed trend direction matches the desired polarity.
 * Flat → false. Null input → null.
 */
export function isImproving(
  result: TrendResult | null | undefined,
  polarity: TrendPolarity,
): boolean | null {
  if (!result) return null;
  if (result.direction === "flat") return false;
  if (polarity === "higher_is_better") return result.direction === "up";
  return result.direction === "down";
}

/**
 * Simple moving average. Window slides over the series; returns one value per
 * index from (window − 1) onward. Empty / invalid window → [].
 */
export function movingAverage(
  values: readonly number[],
  window: number,
): number[] {
  if (window <= 0 || values.length === 0 || window > values.length) {
    return [];
  }

  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= window) sum -= values[i - window];
    if (i >= window - 1) out.push(sum / window);
  }
  return out;
}

/** Delta helper re-exported for domain convenience without a second import. */
export { delta };
