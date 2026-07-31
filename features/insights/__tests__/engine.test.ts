import { describe, expect, it } from "vitest";
import type { AnalyticsSnapshot } from "@/features/analytics";
import { AnalyticsService } from "@/features/analytics";
import { runInsightsEngine } from "../engine";
import type {
  InsightCatalogEntry,
  InsightRule,
  InsightType,
} from "../types";

function emptySnapshot(asOfDate = "2026-07-31"): AnalyticsSnapshot {
  return AnalyticsService.compute({ asOfDate });
}

function stubRule(
  id: string,
  priority: "high" | "medium" | "low",
  opts: { key?: string; type?: InsightType; confidence?: "high" | "medium" | "low" } = {},
): InsightRule {
  const key = opts.key ?? "a";
  const type = opts.type ?? "trend";
  const confidence = opts.confidence ?? "medium";
  return {
    id,
    category: "general",
    evaluate: () => ({
      key,
      type,
      title: id,
      description: id,
      evidence: id,
      category: "general",
      priority,
      confidence,
    }),
  };
}

describe("runInsightsEngine", () => {
  it("skips disabled rules and records them", () => {
    const catalog: InsightCatalogEntry[] = [
      { rule: stubRule("on.rule", "high"), enabled: true },
      { rule: stubRule("off.rule", "high"), enabled: false },
    ];
    const result = runInsightsEngine(emptySnapshot(), catalog);
    expect(result.rulesEvaluated).toEqual(["on.rule"]);
    expect(result.rulesDisabled).toEqual(["off.rule"]);
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0].ruleId).toBe("on.rule");
    expect(result.insights[0].id).toBe("on.rule:a");
    expect(result.insights[0].type).toBe("trend");
    expect(result.insights[0].confidence).toBe("medium");
    expect(result.insights[0].evidence).toBeTruthy();
    expect(result.insights[0].generatedAt).toBeTruthy();
  });

  it("ranks correlations above bare achievements at same priority", () => {
    const catalog: InsightCatalogEntry[] = [
      {
        rule: stubRule("ach", "high", { type: "achievement", key: "1" }),
        enabled: true,
      },
      {
        rule: stubRule("corr", "high", { type: "correlation", key: "1" }),
        enabled: true,
      },
    ];
    const result = runInsightsEngine(emptySnapshot(), catalog, {
      maxInsights: 10,
      suppressLowWhenAbove: 99,
    });
    expect(result.insights[0].type).toBe("correlation");
    expect(result.insights[1].type).toBe("achievement");
  });

  it("caps to a quiet maxInsights (default path ≤8)", () => {
    const catalog: InsightCatalogEntry[] = [
      { rule: stubRule("a", "high", { key: "1", type: "correlation" }), enabled: true },
      { rule: stubRule("b", "high", { key: "1", type: "warning" }), enabled: true },
      { rule: stubRule("c", "high", { key: "1", type: "recommendation" }), enabled: true },
      { rule: stubRule("d", "high", { key: "1", type: "trend" }), enabled: true },
      { rule: stubRule("e", "medium", { key: "1", type: "trend" }), enabled: true },
      { rule: stubRule("f", "medium", { key: "1", type: "achievement" }), enabled: true },
      { rule: stubRule("g", "low", { key: "1", type: "achievement" }), enabled: true },
      { rule: stubRule("h", "high", { key: "1", type: "correlation" }), enabled: true },
      { rule: stubRule("i", "high", { key: "1", type: "recommendation" }), enabled: true },
    ];
    const result = runInsightsEngine(emptySnapshot(), catalog);
    expect(result.insights.length).toBeLessThanOrEqual(8);
    expect(result.insights.every((i) => i.confidence && i.type && i.evidence)).toBe(
      true,
    );
  });

  it("suppresses low priority when enough stronger signals exist", () => {
    const catalog: InsightCatalogEntry[] = [
      { rule: stubRule("h1", "high", { type: "correlation" }), enabled: true },
      { rule: stubRule("h2", "high", { type: "warning" }), enabled: true },
      { rule: stubRule("l1", "low", { type: "achievement" }), enabled: true },
    ];
    const result = runInsightsEngine(emptySnapshot(), catalog, {
      maxInsights: 10,
      suppressLowWhenAbove: 2,
    });
    expect(result.insights.some((i) => i.priority === "low")).toBe(false);
  });

  it("drops non-high achievements when strong signals already exist", () => {
    const catalog: InsightCatalogEntry[] = [
      { rule: stubRule("c1", "high", { type: "correlation", key: "1" }), enabled: true },
      { rule: stubRule("c2", "high", { type: "recommendation", key: "1" }), enabled: true },
      {
        rule: stubRule("a1", "medium", { type: "achievement", key: "1" }),
        enabled: true,
      },
    ];
    const result = runInsightsEngine(emptySnapshot(), catalog, {
      maxInsights: 10,
      suppressLowWhenAbove: 99,
    });
    expect(result.insights.some((i) => i.type === "achievement")).toBe(false);
    expect(result.insights).toHaveLength(2);
  });

  it("suppresses sleep trend when sleep×training correlation already fires", () => {
    const catalog: InsightCatalogEntry[] = [
      {
        rule: {
          id: "combined.cross_domain",
          category: "general",
          evaluate: () => ({
            key: "sleep-better-training",
            type: "correlation",
            title: "corr",
            description: "corr",
            evidence: "e",
            category: "general",
            priority: "high",
            confidence: "high",
          }),
        },
        enabled: true,
      },
      {
        rule: {
          id: "sleep.summary",
          category: "sleep",
          evaluate: () => ({
            key: "better-vs-usual",
            type: "trend",
            title: "echo",
            description: "echo",
            evidence: "e",
            category: "sleep",
            priority: "medium",
            confidence: "medium",
          }),
        },
        enabled: true,
      },
    ];
    const result = runInsightsEngine(emptySnapshot(), catalog, {
      maxInsights: 10,
      suppressLowWhenAbove: 99,
    });
    expect(result.insights.map((i) => i.id)).toEqual([
      "combined.cross_domain:sleep-better-training",
    ]);
  });
});
