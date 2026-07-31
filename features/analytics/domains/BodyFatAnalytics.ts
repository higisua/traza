import type { WeightEntry } from "@/features/weight/WeightTypes";
import { computeScalarSeriesMetrics } from "./scalarSeries";
import type { BodyFatAnalyticsResult } from "../types";

/**
 * Body-fat % lives on weight entries (`bodyFatPct`).
 * Entries without a fat reading are skipped.
 */
export function analyzeBodyFat(
  entries: readonly WeightEntry[],
  asOfDate?: string,
): BodyFatAnalyticsResult {
  return computeScalarSeriesMetrics(
    entries,
    (e) => e.entryDate,
    (e) => e.bodyFatPct,
    "lower_is_better",
    asOfDate,
    0.05,
  );
}
