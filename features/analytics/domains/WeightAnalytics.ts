import type { WeightEntry } from "@/features/weight/WeightTypes";
import { computeScalarSeriesMetrics } from "./scalarSeries";
import type { WeightAnalyticsResult } from "../types";

/** Lower body weight is treated as improvement by default. */
export function analyzeWeight(
  entries: readonly WeightEntry[],
  asOfDate?: string,
): WeightAnalyticsResult {
  return computeScalarSeriesMetrics(
    entries,
    (e) => e.entryDate,
    (e) => e.weightKg,
    "lower_is_better",
    asOfDate,
    0.01,
  );
}
