import { describe, expect, it } from "vitest";
import { distribution, first, last, max, mean, min } from "../stats";

describe("stats", () => {
  it("mean / min / max on numbers", () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(min([2, 4, 6])).toBe(2);
    expect(max([2, 4, 6])).toBe(6);
    expect(mean([])).toBeNull();
  });

  it("first / last on sequences", () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(last([1, 2, 3])).toBe(3);
    expect(first([])).toBeNull();
  });

  it("builds category distribution with ratios", () => {
    const result = distribution(["a", "b", "a", "a"] as const);
    expect(result[0]).toEqual({ key: "a", count: 3, ratio: 0.75 });
    expect(result[1]).toEqual({ key: "b", count: 1, ratio: 0.25 });
  });
});
