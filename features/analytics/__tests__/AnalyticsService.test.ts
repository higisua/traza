import { describe, expect, it } from "vitest";
import { AnalyticsService } from "../AnalyticsService";
import type { WeightEntry } from "@/features/weight/WeightTypes";
import type { BloodPressureEntry } from "@/features/blood-pressure/BloodPressureTypes";
import type { SleepEntry } from "@/features/sleep/SleepTypes";
import type { StepsEntry } from "@/features/steps/StepsTypes";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";

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

function bp(
  partial: Pick<
    BloodPressureEntry,
    "id" | "entryDate" | "systolic" | "diastolic"
  > &
    Partial<BloodPressureEntry>,
): BloodPressureEntry {
  return {
    entryTime: "08:00",
    occurredAt: `${partial.entryDate}T08:00:00`,
    pulse: 70,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function sleep(
  partial: Pick<SleepEntry, "id" | "entryDate" | "durationMinutes"> &
    Partial<SleepEntry>,
): SleepEntry {
  return {
    entryTime: "08:00",
    occurredAt: `${partial.entryDate}T08:00:00`,
    score: null,
    bedTime: null,
    wakeTime: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function steps(
  partial: Pick<StepsEntry, "id" | "entryDate" | "steps">,
): StepsEntry {
  return {
    entryTime: "20:00",
    occurredAt: `${partial.entryDate}T20:00:00`,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function session(partial: {
  id: string;
  sessionDate: string;
  exerciseId: string;
  load: number;
  reps: number;
}): WorkoutSession {
  return {
    id: partial.id,
    templateId: null,
    templateVersionId: null,
    sessionDate: partial.sessionDate,
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 60,
    status: "completed",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    exercises: [
      {
        id: `${partial.id}-ex-1`,
        exerciseId: partial.exerciseId,
        plannedOrder: 0,
        performedOrder: 0,
        status: "completed",
        lastSetRir: null,
        notes: null,
        sets: [
          {
            id: `${partial.id}-set-1`,
            setNumber: 1,
            load: partial.load,
            repetitions: partial.reps,
            durationSeconds: null,
            rir: null,
            createdAt: `${partial.sessionDate}T10:30:00.000Z`,
          },
        ],
      },
    ],
  };
}

describe("AnalyticsService.compute", () => {
  it("returns empty-safe snapshot with period bags", () => {
    const snap = AnalyticsService.compute({ asOfDate: "2026-07-31" });
    expect(snap.weight.count).toBe(0);
    expect(snap.weight.deltas["7d"]).toBeNull();
    expect(snap.weight.delta("7d")).toBeNull();
    expect(snap.workout.totalWorkouts).toBe(0);
    expect(snap.workout.personalRecords).toEqual([]);
    expect(snap.bloodPressure.last).toBeNull();
    expect(snap.sleep.lastNight).toBeNull();
    expect(snap.steps.lastDay).toBeNull();
    expect(snap.streaks.weightLoggingDays).toBe(0);
  });

  it("derives weight period deltas and trend accessors", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      weight: [
        weight({ id: "1", entryDate: "2026-07-01", weightKg: 80 }),
        weight({ id: "2", entryDate: "2026-07-24", weightKg: 79 }),
        weight({ id: "3", entryDate: "2026-07-31", weightKg: 78 }),
      ],
    });
    expect(snap.weight.last).toBe(78);
    expect(snap.weight.lastDate).toBe("2026-07-31");
    expect(snap.weight.first).toBe(80);
    expect(snap.weight.deltas.all?.absolute).toBe(-2);
    expect(snap.weight.delta("all")?.absolute).toBe(-2);
    expect(snap.weight.delta("7d")?.absolute).toBe(-1);
    expect(snap.weight.trend("all")?.direction).toBe("down");
    expect(snap.weight.isImproving).toBe(true);
    expect(snap.streaks.weightLoggingDays).toBe(1);
  });

  it("enriches blood pressure with last reading and channel periods", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      bloodPressure: [
        bp({
          id: "1",
          entryDate: "2026-07-01",
          systolic: 130,
          diastolic: 85,
          pulse: 72,
        }),
        bp({
          id: "2",
          entryDate: "2026-07-31",
          systolic: 120,
          diastolic: 78,
          pulse: 68,
        }),
      ],
    });
    expect(snap.bloodPressure.last).toEqual({
      entryDate: "2026-07-31",
      entryTime: "08:00",
      systolic: 120,
      diastolic: 78,
      pulse: 68,
    });
    expect(snap.bloodPressure.systolic.delta("all")?.absolute).toBe(-10);
    expect(snap.bloodPressure.diastolic.trend("all")?.direction).toBe("down");
    expect(snap.bloodPressure.isImproving).toBe(true);
  });

  it("adds sleep duration/score period metrics and lastNight", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      sleep: [
        sleep({
          id: "1",
          entryDate: "2026-07-01",
          durationMinutes: 360,
          score: 60,
        }),
        sleep({
          id: "2",
          entryDate: "2026-07-31",
          durationMinutes: 480,
          score: 85,
        }),
      ],
    });
    expect(snap.sleep.lastNight?.entryDate).toBe("2026-07-31");
    expect(snap.sleep.duration.delta("all")?.absolute).toBe(120);
    expect(snap.sleep.score.trend("all")?.direction).toBe("up");
    expect(snap.sleep.bestNight?.score).toBe(85);
  });

  it("adds steps period bags and lastDay", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      stepsGoal: 8000,
      steps: [
        steps({ id: "1", entryDate: "2026-07-01", steps: 5000 }),
        steps({ id: "2", entryDate: "2026-07-24", steps: 9000 }),
        steps({ id: "3", entryDate: "2026-07-31", steps: 10000 }),
      ],
    });
    expect(snap.steps.lastDay).toEqual({
      entryDate: "2026-07-31",
      totalSteps: 10000,
    });
    expect(snap.steps.delta("7d")?.absolute).toBe(1000);
    expect(snap.steps.average("all")).toBeCloseTo(8000);
    expect(snap.steps.trend("all")?.direction).toBe("up");
    expect(snap.streaks.stepsGoalDays).toBe(1);
  });

  it("integrates personal records into workout snapshot", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      workouts: [
        session({
          id: "s1",
          sessionDate: "2026-07-01",
          exerciseId: "bench-press",
          load: 60,
          reps: 8,
        }),
        session({
          id: "s2",
          sessionDate: "2026-07-20",
          exerciseId: "bench-press",
          load: 80,
          reps: 5,
        }),
      ],
    });
    expect(snap.workout.totalWorkouts).toBe(2);
    expect(snap.workout.personalRecords).toHaveLength(1);
    const prs = snap.workout.personalRecords[0];
    expect(prs.exerciseId).toBe("bench-press");
    const kinds = prs.records.map((r) => r.kind).sort();
    expect(kinds).toEqual(["max_load", "max_reps", "max_volume"]);
    expect(prs.records.find((r) => r.kind === "max_load")?.load).toBe(80);
    expect(prs.records.find((r) => r.kind === "max_reps")?.repetitions).toBe(8);
  });
});
