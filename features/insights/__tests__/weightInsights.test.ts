import { describe, expect, it } from "vitest";
import { AnalyticsService } from "@/features/analytics";
import type { WeightEntry } from "@/features/weight/WeightTypes";
import { weightInsightsRule } from "../rules/weightInsights";
import { InsightsService } from "../InsightsService";

function weight(
  partial: Pick<WeightEntry, "id" | "entryDate" | "weightKg"> &
    Partial<WeightEntry>,
): WeightEntry {
  return {
    entryTime: "08:00",
    occurredAt: `${partial.entryDate}T08:00:00`,
    bodyFatPct: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

describe("weightInsightsRule", () => {
  it("emits sustained lost-this-month trend when 30d drop is meaningful", () => {
    const entries: WeightEntry[] = [
      weight({ id: "w1", entryDate: "2026-07-01", weightKg: 80 }),
      weight({ id: "w2", entryDate: "2026-07-10", weightKg: 79 }),
      weight({ id: "w3", entryDate: "2026-07-20", weightKg: 78 }),
      weight({ id: "w4", entryDate: "2026-07-31", weightKg: 77 }),
    ];
    const snap = AnalyticsService.compute({
      weight: entries,
      asOfDate: "2026-07-31",
    });
    const insights = weightInsightsRule.evaluate(snap);
    const list = Array.isArray(insights) ? insights : insights ? [insights] : [];
    const lost = list.find((i) => i.key === "lost-month");
    expect(lost).toBeTruthy();
    expect(lost!.type).toBe("trend");
    expect(lost!.confidence).toMatch(/high|medium/);
    expect(lost!.evidence).toMatch(/kg/);
    expect(lost!.title).toMatch(/sostení|baj|pérdida/i);
  });

  it("does NOT emit bare new historical min (metric echo killed)", () => {
    const entries: WeightEntry[] = [
      weight({ id: "w1", entryDate: "2026-05-01", weightKg: 82 }),
      weight({ id: "w2", entryDate: "2026-06-01", weightKg: 81 }),
      weight({ id: "w3", entryDate: "2026-06-15", weightKg: 80 }),
      weight({ id: "w4", entryDate: "2026-07-01", weightKg: 79 }),
      weight({ id: "w5", entryDate: "2026-07-30", weightKg: 78 }),
    ];
    const snap = AnalyticsService.compute({
      weight: entries,
      asOfDate: "2026-07-31",
    });
    const insights = weightInsightsRule.evaluate(snap);
    const list = Array.isArray(insights) ? insights : insights ? [insights] : [];
    expect(list.some((i) => i.key === "new-min")).toBe(false);
    expect(list.some((i) => i.key === "new-max")).toBe(false);
  });

  it("does NOT emit stable-weight status reformulation", () => {
    const entries: WeightEntry[] = [
      weight({ id: "w1", entryDate: "2026-07-01", weightKg: 75.0 }),
      weight({ id: "w2", entryDate: "2026-07-10", weightKg: 75.1 }),
      weight({ id: "w3", entryDate: "2026-07-20", weightKg: 74.9 }),
      weight({ id: "w4", entryDate: "2026-07-31", weightKg: 75.1 }),
    ];
    const snap = AnalyticsService.compute({
      weight: entries,
      asOfDate: "2026-07-31",
    });
    const insights = weightInsightsRule.evaluate(snap);
    const list = Array.isArray(insights) ? insights : insights ? [insights] : [];
    expect(list.some((i) => i.key === "stable")).toBe(false);
  });
});

describe("InsightsService.fromSnapshot", () => {
  it("returns capped insights with required model fields", () => {
    const entries: WeightEntry[] = [
      weight({ id: "w1", entryDate: "2026-07-01", weightKg: 85 }),
      weight({ id: "w2", entryDate: "2026-07-15", weightKg: 83 }),
      weight({ id: "w3", entryDate: "2026-07-31", weightKg: 81 }),
      weight({ id: "w0", entryDate: "2026-05-01", weightKg: 86 }),
      weight({ id: "w00", entryDate: "2026-06-01", weightKg: 85.5 }),
    ];
    const snap = AnalyticsService.compute({
      weight: entries,
      asOfDate: "2026-07-31",
    });
    const result = InsightsService.fromSnapshot(snap);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.length).toBeLessThanOrEqual(8);
    expect(
      result.insights.every(
        (i) =>
          i.ruleId &&
          i.title &&
          i.description &&
          i.evidence &&
          i.type &&
          i.confidence &&
          i.generatedAt,
      ),
    ).toBe(true);
  });
});
