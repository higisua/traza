export { InsightsService } from "./InsightsService";
export type { InsightsComputeOptions } from "./InsightsService";

export {
  runInsightsEngine,
  DEFAULT_MAX_INSIGHTS,
  PRIMARY_INSIGHTS_COUNT,
} from "./engine";
export { INSIGHTS_CATALOG, catalogWithOverrides, getCatalogEntry } from "./catalog";

export type {
  Insight,
  InsightCandidate,
  InsightCatalogEntry,
  InsightCategory,
  InsightConfidence,
  InsightPriority,
  InsightRule,
  InsightType,
  InsightsEngineOptions,
  InsightsResult,
} from "./types";
