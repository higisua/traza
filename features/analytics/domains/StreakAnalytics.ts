import type { WeightEntry } from "@/features/weight/WeightTypes";
import type { SleepEntry } from "@/features/sleep/SleepTypes";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";
import { getDailyStepsGoal } from "@/features/steps/StepsGoal";
import { currentDayStreak, currentWeekStreak } from "../core";
import type { DailyStepsTotal } from "./StepsAnalytics";
import type { CrossCuttingStreaks } from "../types";

/**
 * Cross-cutting streaks. Accepts pre-aggregated daily steps to avoid
 * recomputing the same aggregation StepsAnalytics already produced.
 */
export function analyzeCrossCuttingStreaks(input: {
  weight: readonly WeightEntry[];
  sleep: readonly SleepEntry[];
  /** Pre-aggregated daily step totals (from aggregateDailySteps). */
  dailySteps: readonly DailyStepsTotal[];
  workouts: readonly WorkoutSession[];
  asOfDate?: string;
  stepsGoal?: number;
}): CrossCuttingStreaks {
  const goal = input.stepsGoal ?? getDailyStepsGoal();
  const asOf = input.asOfDate;

  const weightDates = input.weight.map((e) => e.entryDate);
  const sleepDates = input.sleep.map((e) => e.entryDate);
  const goalDates = input.dailySteps
    .filter((d) => d.totalSteps >= goal)
    .map((d) => d.entryDate);
  const workoutDates = input.workouts
    .filter((s) => s.status === "completed" || s.status === "partial")
    .map((s) => s.sessionDate);

  return {
    weightLoggingDays: currentDayStreak(weightDates, asOf),
    sleepLoggingDays: currentDayStreak(sleepDates, asOf),
    stepsGoalDays: currentDayStreak(goalDates, asOf),
    trainingWeeks: currentWeekStreak(workoutDates, asOf),
  };
}
