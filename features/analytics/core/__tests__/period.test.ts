import { describe, expect, it } from "vitest";
import {
  computePeriodMetrics,
  periodAverage,
  periodDays,
  periodDelta,
  pointsInPeriod,
  withPeriodAccessors,
} from "../period";
import type { TimedValue } from "../types";

const series: TimedValue[] = [
  { date: "2026-07-01", value: 80 },
  { date: "2026-07-10", value: 79 },
  { date: "2026-07-24", value: 78 },
  { date: "2026-07-31", value: 77 },
];

describe("periodDays", () => {
  it("maps named periods to day counts", () => {
    expect(periodDays("7d")).toBe(7);
    expect(periodDays("30d")).toBe(30);
    expect(periodDays("90d")).toBe(90);
    expect(periodDays("all")).toBeNull();
  });
});

describe("pointsInPeriod", () => {
  it("filters rolling windows ending at asOf", () => {
    const week = pointsInPeriod(series, "7d", "2026-07-31");
    expect(week.map((p) => p.date)).toEqual(["2026-07-24", "2026-07-31"]);
  });

  it("returns full history for all", () => {
    expect(pointsInPeriod(series, "all", "2026-07-31")).toHaveLength(4);
  });
});

describe("periodDelta / periodAverage", () => {
  it("computes 7d delta vs baseline at asOf−7", () => {
    // baseline at or before 2026-07-24 → 78; latest → 77
    const d = periodDelta(series, "7d", "2026-07-31");
    expect(d?.from).toBe(78);
    expect(d?.to).toBe(77);
    expect(d?.absolute).toBe(-1);
  });

  it("computes all-span delta", () => {
    expect(periodDelta(series, "all")?.absolute).toBe(-3);
  });

  it("averages values inside the window", () => {
    expect(periodAverage(series, "7d", "2026-07-31")).toBe(77.5);
    expect(periodAverage(series, "all")).toBe(78.5);
  });
});

describe("computePeriodMetrics + accessors", () => {
  it("precomputes bags and exposes accessors", () => {
    const bag = withPeriodAccessors(
      computePeriodMetrics(series, "2026-07-31"),
    );
    expect(bag.delta("7d")?.absolute).toBe(-1);
    expect(bag.average("all")).toBe(78.5);
    expect(bag.trend("all")?.direction).toBe("down");
    expect(bag.deltas["30d"]).not.toBeNull();
    expect(bag.trends["90d"]).not.toBeNull();
  });

  it("returns nulls for empty series", () => {
    const bag = computePeriodMetrics([]);
    expect(bag.deltas["7d"]).toBeNull();
    expect(bag.averages.all).toBeNull();
    expect(bag.trends.all).toBeNull();
  });
});
