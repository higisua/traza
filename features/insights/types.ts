import type { AnalyticsSnapshot } from "@/features/analytics";

/** Domain the insight speaks about. */
export type InsightCategory =
  | "weight"
  | "body_fat"
  | "sleep"
  | "steps"
  | "blood_pressure"
  | "measurements"
  | "workout"
  | "general";

export type InsightPriority = "high" | "medium" | "low";

/**
 * Product type — drives /dev grouping and ranking weight.
 * correlation / warning / recommendation outrank bare achievements.
 */
export type InsightType =
  | "achievement"
  | "trend"
  | "correlation"
  | "warning"
  | "recommendation";

export type InsightConfidence = "high" | "medium" | "low";

/**
 * Product-facing insight: a conclusion, not a raw metric dump.
 * Must mean something the user would not get from a chart in ~10 seconds.
 */
export type Insight = {
  id: string;
  type: InsightType;
  category: InsightCategory;
  priority: InsightPriority;
  confidence: InsightConfidence;
  title: string;
  description: string;
  /** Concrete numbers / comparisons that back the claim. */
  evidence: string;
  /** Optional plain-text next step (no buttons). */
  action?: string;
  generatedAt: string;
  /** Catalog rule that produced this insight. */
  ruleId: string;
  /** Optional calendar anchor for the signal. */
  date?: string;
};

/** Internal candidate before engine assigns id / generatedAt / filters. */
export type InsightCandidate = Omit<Insight, "id" | "ruleId" | "generatedAt"> & {
  /** Stable suffix; engine builds `ruleId:suffix` or uses ruleId alone. */
  key?: string;
};

export type InsightRuleEvaluate = (
  snapshot: AnalyticsSnapshot,
) => InsightCandidate | InsightCandidate[] | null;

/** Pure rule implementation (no enable flag — catalog owns that). */
export type InsightRule = {
  id: string;
  category: InsightCategory;
  evaluate: InsightRuleEvaluate;
};

export type InsightCatalogEntry = {
  rule: InsightRule;
  /** When false, the rule is skipped entirely. */
  enabled: boolean;
};

export type InsightsEngineOptions = {
  /**
   * Quiet upper bound after ranking (default 8).
   * Product UI surfaces the first 3 as principales + “Ver más” for the rest.
   */
  maxInsights?: number;
  /** Drop `low` priority when more than this many higher-priority exist. */
  suppressLowWhenAbove?: number;
};

export type InsightsResult = {
  computedAt: string;
  asOfDate: string;
  insights: Insight[];
  /** Rules that ran (enabled), for debug dumps. */
  rulesEvaluated: string[];
  /** Rules skipped because disabled in catalog. */
  rulesDisabled: string[];
};
