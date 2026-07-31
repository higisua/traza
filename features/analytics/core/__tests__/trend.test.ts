import { describe, expect, it } from "vitest";
import { isImproving, movingAverage, trend, trendFromTimed } from "../trend";

describe("trend", () => {
  it("returns null for empty series", () => {
    expect(trend([])).toBeNull();
  });

  it("marks single point as flat", () => {
    expect(trend([42])?.direction).toBe("flat");
  });

  it("detects upward and downward trends", () => {
    expect(trend([1, 2, 3])?.direction).toBe("up");
    expect(trend([3, 2, 1])?.direction).toBe("down");
    expect(trend([5, 5, 5])?.direction).toBe("flat");
  });

  it("computes least-squares slope for timed series", () => {
    const result = trendFromTimed([
      { date: "2026-01-01", value: 10 },
      { date: "2026-01-02", value: 12 },
      { date: "2026-01-03", value: 14 },
    ]);
    expect(result?.direction).toBe("up");
    expect(result?.slope).toBeCloseTo(2);
  });
});

describe("isImproving", () => {
  it("respects polarity", () => {
    const down = trend([80, 79, 78])!;
    expect(isImproving(down, "lower_is_better")).toBe(true);
    expect(isImproving(down, "higher_is_better")).toBe(false);

    const up = trend([1000, 2000, 3000])!;
    expect(isImproving(up, "higher_is_better")).toBe(true);
    expect(isImproving(up, "lower_is_better")).toBe(false);
  });

  it("treats flat as not improving", () => {
    expect(isImproving(trend([1, 1]), "higher_is_better")).toBe(false);
  });
});

describe("movingAverage", () => {
  it("slides a fixed window", () => {
    expect(movingAverage([1, 2, 3, 4], 2)).toEqual([1.5, 2.5, 3.5]);
  });

  it("returns empty for invalid windows", () => {
    expect(movingAverage([1, 2], 3)).toEqual([]);
    expect(movingAverage([], 2)).toEqual([]);
  });
});
