import { describe, expect, it } from "vitest";
import {
  bestDayStreak,
  currentDayStreak,
  currentWeekStreak,
  uniqueSortedDates,
} from "../streak";

describe("streak", () => {
  it("dedupes and sorts dates", () => {
    expect(uniqueSortedDates(["2026-01-03", "2026-01-01", "2026-01-03"])).toEqual([
      "2026-01-01",
      "2026-01-03",
    ]);
  });

  it("computes best consecutive day streak", () => {
    expect(
      bestDayStreak([
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-05",
        "2026-01-06",
      ]),
    ).toBe(3);
  });

  it("computes current streak ending on asOfDate", () => {
    const dates = ["2026-07-28", "2026-07-29", "2026-07-30", "2026-07-31"];
    expect(currentDayStreak(dates, "2026-07-31")).toBe(4);
    expect(currentDayStreak(dates, "2026-08-01")).toBe(0);
  });

  it("computes consecutive training weeks", () => {
    // Three ISO weeks in a row (Thu anchors)
    const dates = [
      "2026-07-13", // week of Jul 13
      "2026-07-20",
      "2026-07-27",
    ];
    expect(currentWeekStreak(dates, "2026-07-31")).toBe(3);
  });
});
