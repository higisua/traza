import type {
  Insight,
  InsightCandidate,
  InsightCatalogEntry,
  InsightConfidence,
  InsightPriority,
  InsightType,
  InsightsEngineOptions,
  InsightsResult,
} from "./types";
import type { AnalyticsSnapshot } from "@/features/analytics";

const PRIORITY_RANK: Record<InsightPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/** Prefer meaning over metric-echo: correlations / warnings / recs first. */
const TYPE_RANK: Record<InsightType, number> = {
  correlation: 5,
  warning: 5,
  recommendation: 4,
  trend: 3,
  achievement: 1,
};

const CONFIDENCE_RANK: Record<InsightConfidence, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Quiet upper bound for engine output. UI surfaces the first
 * {@link PRIMARY_INSIGHTS_COUNT} as principales + “Ver más” for the rest.
 */
export const DEFAULT_MAX_INSIGHTS = 8;

/** Product surface: max insights shown as primary before “Ver más”. */
export const PRIMARY_INSIGHTS_COUNT = 3;

const DEFAULT_SUPPRESS_LOW_WHEN_ABOVE = 2;

function normalizeCandidates(
  ruleId: string,
  generatedAt: string,
  raw: InsightCandidate | InsightCandidate[] | null,
): Insight[] {
  if (raw == null) return [];
  const list = Array.isArray(raw) ? raw : [raw];
  return list.map((candidate) => {
    const suffix = candidate.key ? `:${candidate.key}` : "";
    return {
      type: candidate.type,
      category: candidate.category,
      priority: candidate.priority,
      confidence: candidate.confidence,
      title: candidate.title,
      description: candidate.description,
      evidence: candidate.evidence,
      action: candidate.action,
      date: candidate.date,
      generatedAt,
      id: `${ruleId}${suffix}`,
      ruleId,
    };
  });
}

function impactScore(insight: Insight): number {
  return (
    PRIORITY_RANK[insight.priority] * 100 +
    TYPE_RANK[insight.type] * 10 +
    CONFIDENCE_RANK[insight.confidence]
  );
}

function sortInsights(a: Insight, b: Insight): number {
  const byImpact = impactScore(b) - impactScore(a);
  if (byImpact !== 0) return byImpact;
  const byCategory = a.category.localeCompare(b.category);
  if (byCategory !== 0) return byCategory;
  return a.id.localeCompare(b.id);
}

/**
 * When a correlation already tells the richer story, drop the chart-echo sibling.
 */
function suppressRedundantEchoes(insights: Insight[]): Insight[] {
  const ids = new Set(insights.map((i) => i.id));
  return insights.filter((insight) => {
    if (
      insight.id === "sleep.summary:better-vs-usual" &&
      (ids.has("combined.cross_domain:sleep-better-training") ||
        ids.has("combined.cross_domain:sleep-up-bp-down") ||
        ids.has("combined.cross_domain:sleep-up-volume-up"))
    ) {
      return false;
    }
    if (
      insight.id === "sleep.summary:worse-vs-usual" &&
      ids.has("combined.cross_domain:soft-perf-short-sleep")
    ) {
      return false;
    }
    if (
      insight.id === "blood_pressure.summary:improved-month" &&
      ids.has("combined.cross_domain:sleep-up-bp-down")
    ) {
      return false;
    }
    if (
      insight.id === "weight.summary:lost-month" &&
      (ids.has("combined.cross_domain:weight-down-volume-up") ||
        ids.has("combined.cross_domain:weight-waist-both-down"))
    ) {
      return false;
    }
    if (
      insight.id === "body_fat.summary:improving" &&
      ids.has("combined.cross_domain:training-fat-down")
    ) {
      return false;
    }
    if (
      insight.id === "measurements.summary:waist-swing" &&
      (ids.has("combined.cross_domain:waist-down-weight-stable") ||
        ids.has("combined.cross_domain:weight-waist-both-down"))
    ) {
      return false;
    }
    if (
      insight.id === "workout.summary:volume-above-usual" &&
      ids.has("combined.cross_domain:sleep-up-volume-up")
    ) {
      return false;
    }
    if (
      insight.id === "workout.summary:recent-pr" &&
      ids.has("workout.summary:try-load-increase")
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Run enabled catalog rules against a snapshot, filter noise, rank by impact, cap.
 * Pure — no I/O, no React.
 */
export function runInsightsEngine(
  snapshot: AnalyticsSnapshot,
  catalog: readonly InsightCatalogEntry[],
  options: InsightsEngineOptions = {},
): InsightsResult {
  const maxInsights = options.maxInsights ?? DEFAULT_MAX_INSIGHTS;
  const suppressLowWhenAbove =
    options.suppressLowWhenAbove ?? DEFAULT_SUPPRESS_LOW_WHEN_ABOVE;
  const generatedAt = new Date().toISOString();

  const rulesEvaluated: string[] = [];
  const rulesDisabled: string[] = [];
  const collected: Insight[] = [];

  for (const entry of catalog) {
    if (!entry.enabled) {
      rulesDisabled.push(entry.rule.id);
      continue;
    }
    rulesEvaluated.push(entry.rule.id);
    const raw = entry.rule.evaluate(snapshot);
    collected.push(...normalizeCandidates(entry.rule.id, generatedAt, raw));
  }

  // De-dupe by id (last write wins — catalog order should avoid overlaps).
  const byId = new Map<string, Insight>();
  for (const insight of collected) {
    byId.set(insight.id, insight);
  }

  let ranked = Array.from(byId.values()).sort(sortInsights);

  // Drop single-domain echoes when a richer cross-domain insight already covers them.
  ranked = suppressRedundantEchoes(ranked);

  const nonLowCount = ranked.filter((i) => i.priority !== "low").length;
  if (nonLowCount >= suppressLowWhenAbove) {
    ranked = ranked.filter((i) => i.priority !== "low");
  }

  // Prefer quieter output: if we already have strong signals, drop bare low-impact achievements.
  const strongCount = ranked.filter(
    (i) =>
      i.type === "correlation" ||
      i.type === "warning" ||
      i.type === "recommendation" ||
      (i.type === "trend" && i.priority === "high"),
  ).length;
  if (strongCount >= 2) {
    ranked = ranked.filter(
      (i) => !(i.type === "achievement" && i.priority !== "high"),
    );
  }

  const insights = ranked.slice(0, maxInsights);

  return {
    computedAt: generatedAt,
    asOfDate: snapshot.asOfDate,
    insights,
    rulesEvaluated,
    rulesDisabled,
  };
}
