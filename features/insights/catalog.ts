import type { InsightCatalogEntry } from "./types";
import { weightInsightsRule } from "./rules/weightInsights";
import { bodyFatInsightsRule } from "./rules/bodyFatInsights";
import { sleepInsightsRule } from "./rules/sleepInsights";
import { stepsInsightsRule } from "./rules/stepsInsights";
import { bloodPressureInsightsRule } from "./rules/bloodPressureInsights";
import { measurementInsightsRule } from "./rules/measurementInsights";
import { workoutInsightsRule } from "./rules/workoutInsights";
import { combinedInsightsRule } from "./rules/combinedInsights";

/**
 * Master catalog: each rule can be toggled independently.
 * Combined rules are listed first so they win ties when capping.
 */
export const INSIGHTS_CATALOG: InsightCatalogEntry[] = [
  { rule: combinedInsightsRule, enabled: true },
  { rule: weightInsightsRule, enabled: true },
  { rule: bodyFatInsightsRule, enabled: true },
  { rule: sleepInsightsRule, enabled: true },
  { rule: stepsInsightsRule, enabled: true },
  { rule: bloodPressureInsightsRule, enabled: true },
  { rule: measurementInsightsRule, enabled: true },
  { rule: workoutInsightsRule, enabled: true },
];

/** Lookup helper for tests / future settings UI. */
export function getCatalogEntry(ruleId: string): InsightCatalogEntry | undefined {
  return INSIGHTS_CATALOG.find((e) => e.rule.id === ruleId);
}

/**
 * Clone catalog with per-rule enable overrides (does not mutate the default).
 */
export function catalogWithOverrides(
  overrides: Record<string, boolean>,
): InsightCatalogEntry[] {
  return INSIGHTS_CATALOG.map((entry) => ({
    rule: entry.rule,
    enabled:
      overrides[entry.rule.id] !== undefined
        ? overrides[entry.rule.id]
        : entry.enabled,
  }));
}
