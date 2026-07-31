import { describe, expect, it } from "vitest";
import { delta, deltaOrNull } from "../delta";

describe("delta", () => {
  it("computes absolute and percent change", () => {
    expect(delta(100, 110)).toEqual({
      absolute: 10,
      percent: 10,
      from: 100,
      to: 110,
    });
  });

  it("returns null percent when baseline is zero", () => {
    expect(delta(0, 5)).toEqual({
      absolute: 5,
      percent: null,
      from: 0,
      to: 5,
    });
  });

  it("handles negative baselines via absolute percent", () => {
    expect(delta(-10, -5).percent).toBe(50);
  });

  it("deltaOrNull guards missing values", () => {
    expect(deltaOrNull(null, 1)).toBeNull();
    expect(deltaOrNull(1, undefined)).toBeNull();
    expect(deltaOrNull(2, 4)?.absolute).toBe(2);
  });
});
