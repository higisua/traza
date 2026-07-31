import { WeightRepository } from "@/features/weight/WeightRepository";
import { BloodPressureRepository } from "@/features/blood-pressure/BloodPressureRepository";
import { SleepRepository } from "@/features/sleep/SleepRepository";
import { StepsRepository } from "@/features/steps/StepsRepository";
import { MeasurementRepository } from "@/features/measurements/MeasurementRepository";
import { WorkoutRepository } from "@/features/workout/WorkoutRepository";
import { getDailyStepsGoal } from "@/features/steps/StepsGoal";
import { nowDateInputValue } from "@/lib/tracking/dateTime";

import { analyzeWeight } from "./domains/WeightAnalytics";
import { analyzeBodyFat } from "./domains/BodyFatAnalytics";
import { analyzeBloodPressure } from "./domains/BloodPressureAnalytics";
import { analyzeSleep } from "./domains/SleepAnalytics";
import {
  aggregateDailySteps,
  analyzeStepsFromDaily,
} from "./domains/StepsAnalytics";
import { analyzeBodyMeasurements } from "./domains/BodyMeasurementsAnalytics";
import { analyzeWorkouts } from "./domains/WorkoutAnalytics";
import { analyzeCrossCuttingStreaks } from "./domains/StreakAnalytics";

import type { AnalyticsSnapshot } from "./types";
import type { WeightEntry } from "@/features/weight/WeightTypes";
import type { BloodPressureEntry } from "@/features/blood-pressure/BloodPressureTypes";
import type { SleepEntry } from "@/features/sleep/SleepTypes";
import type { StepsEntry } from "@/features/steps/StepsTypes";
import type { MeasurementEntry } from "@/features/measurements/MeasurementTypes";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";

export type AnalyticsComputeInput = {
  weight?: readonly WeightEntry[];
  bloodPressure?: readonly BloodPressureEntry[];
  sleep?: readonly SleepEntry[];
  steps?: readonly StepsEntry[];
  measurements?: readonly MeasurementEntry[];
  workouts?: readonly WorkoutSession[];
  asOfDate?: string;
  stepsGoal?: number;
};

/**
 * Central analytics façade.
 * Domains compute their metrics; this service only loads snapshots and aggregates.
 * Pure `compute` accepts injected arrays for tests / offline reuse.
 */
export const AnalyticsService = {
  /**
   * Full derived snapshot from live repositories (client-side storage).
   */
  getSnapshot(options?: {
    asOfDate?: string;
    stepsGoal?: number;
  }): AnalyticsSnapshot {
    return this.compute({
      weight: WeightRepository.getAll(),
      bloodPressure: BloodPressureRepository.getAll(),
      sleep: SleepRepository.getAll(),
      steps: StepsRepository.getAll(),
      measurements: MeasurementRepository.getAll(),
      workouts: WorkoutRepository.getSessions(),
      asOfDate: options?.asOfDate,
      stepsGoal: options?.stepsGoal,
    });
  },

  /**
   * Pure aggregation over provided entry arrays — no I/O.
   * Prefer this for unit tests and future incremental pipelines.
   */
  compute(input: AnalyticsComputeInput = {}): AnalyticsSnapshot {
    const asOfDate = input.asOfDate ?? nowDateInputValue();
    const stepsGoal = input.stepsGoal ?? getDailyStepsGoal();

    const weight = input.weight ?? [];
    const bloodPressure = input.bloodPressure ?? [];
    const sleep = input.sleep ?? [];
    const steps = input.steps ?? [];
    const measurements = input.measurements ?? [];
    const workouts = input.workouts ?? [];

    // Single steps aggregation shared by Steps + Streak domains.
    const dailySteps = aggregateDailySteps(steps);

    return {
      computedAt: new Date().toISOString(),
      asOfDate,
      weight: analyzeWeight(weight, asOfDate),
      bodyFat: analyzeBodyFat(weight, asOfDate),
      bloodPressure: analyzeBloodPressure(bloodPressure, asOfDate),
      sleep: analyzeSleep(sleep, asOfDate),
      steps: analyzeStepsFromDaily(dailySteps, {
        goal: stepsGoal,
        asOfDate,
      }),
      measurements: analyzeBodyMeasurements(measurements, asOfDate),
      workout: analyzeWorkouts(workouts, asOfDate),
      streaks: analyzeCrossCuttingStreaks({
        weight,
        sleep,
        dailySteps,
        workouts,
        asOfDate,
        stepsGoal,
      }),
    };
  },
};
