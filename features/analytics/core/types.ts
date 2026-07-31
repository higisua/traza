/**
 * Universal analytics primitives — pure, domain-agnostic.
 */

export type TrendDirection = "up" | "down" | "flat";

/** Whether an upward numeric change is desirable for the metric. */
export type TrendPolarity = "higher_is_better" | "lower_is_better";

export type TrendResult = {
  direction: TrendDirection;
  /** Signed slope (units per step / per day depending on caller). */
  slope: number;
  /** Absolute change over the analysed window (last − first of window). */
  change: number;
  sampleCount: number;
};

export type DeltaResult = {
  absolute: number;
  /** Relative change vs baseline; null when baseline is 0. */
  percent: number | null;
  from: number;
  to: number;
};

export type TimedValue = {
  /** Calendar day YYYY-MM-DD */
  date: string;
  value: number;
};

export type DistributionBucket<T extends string = string> = {
  key: T;
  count: number;
  /** Share of total in [0, 1]. */
  ratio: number;
};
