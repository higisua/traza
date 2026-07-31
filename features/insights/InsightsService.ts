import { AnalyticsService } from "@/features/analytics";
import type { AnalyticsSnapshot } from "@/features/analytics";
import { INSIGHTS_CATALOG, catalogWithOverrides } from "./catalog";
import { runInsightsEngine } from "./engine";
import type {
  InsightCatalogEntry,
  InsightsEngineOptions,
  InsightsResult,
} from "./types";

export type InsightsComputeOptions = InsightsEngineOptions & {
  /** Override catalog enable flags by rule id. */
  ruleOverrides?: Record<string, boolean>;
  /** Replace the whole catalog (tests). */
  catalog?: readonly InsightCatalogEntry[];
};

/**
 * Insights façade — consumes AnalyticsSnapshot only.
 * Prefer `fromSnapshot` in tests; `getInsights` for live repositories.
 */
export const InsightsService = {
  /**
   * Live path: AnalyticsService.getSnapshot() → engine.
   */
  getInsights(options?: InsightsComputeOptions & { asOfDate?: string }): InsightsResult {
    const snapshot = AnalyticsService.getSnapshot({
      asOfDate: options?.asOfDate,
    });
    return this.fromSnapshot(snapshot, options);
  },

  /**
   * Pure path over an already-computed snapshot (or AnalyticsService.compute).
   */
  fromSnapshot(
    snapshot: AnalyticsSnapshot,
    options: InsightsComputeOptions = {},
  ): InsightsResult {
    const catalog =
      options.catalog ??
      (options.ruleOverrides
        ? catalogWithOverrides(options.ruleOverrides)
        : INSIGHTS_CATALOG);

    return runInsightsEngine(snapshot, catalog, {
      maxInsights: options.maxInsights,
      suppressLowWhenAbove: options.suppressLowWhenAbove,
    });
  },
};
