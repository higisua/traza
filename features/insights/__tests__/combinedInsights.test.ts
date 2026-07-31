import { describe, expect, it } from "vitest";
import { AnalyticsService } from "@/features/analytics";
import type { WeightEntry } from "@/features/weight/WeightTypes";
import type { MeasurementEntry } from "@/features/measurements/MeasurementTypes";
import type { StepsEntry } from "@/features/steps/StepsTypes";
import type { SleepEntry } from "@/features/sleep/SleepTypes";
import type { BloodPressureEntry } from "@/features/blood-pressure/BloodPressureTypes";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";
import { combinedInsightsRule } from "../rules/combinedInsights";
import { bloodPressureInsightsRule } from "../rules/bloodPressureInsights";
import { bodyFatInsightsRule } from "../rules/bodyFatInsights";
import { sleepInsightsRule } from "../rules/sleepInsights";
import { stepsInsightsRule } from "../rules/stepsInsights";
import { workoutInsightsRule } from "../rules/workoutInsights";
import { weightInsightsRule } from "../rules/weightInsights";
import { measurementInsightsRule } from "../rules/measurementInsights";

const TITLE_MAX = 80;
const DESC_MAX = 180;

function assertCopyLength(insight: {
  title: string;
  description: string;
}) {
  expect(insight.title.length).toBeLessThanOrEqual(TITLE_MAX);
  expect(insight.description.length).toBeLessThanOrEqual(DESC_MAX);
}

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

function measurement(
  partial: Pick<MeasurementEntry, "id" | "entryDate"> &
    Partial<MeasurementEntry>,
): MeasurementEntry {
  return {
    entryTime: "08:00",
    occurredAt: `${partial.entryDate}T08:00:00`,
    waistCm: 85,
    armCm: 35,
    legCm: 55,
    photos: null,
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

function bp(
  partial: Pick<
    BloodPressureEntry,
    "id" | "entryDate" | "systolic" | "diastolic"
  > &
    Partial<BloodPressureEntry>,
): BloodPressureEntry {
  return {
    entryTime: "09:00",
    occurredAt: `${partial.entryDate}T09:00:00`,
    pulse: 60,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

function session(
  partial: {
    id: string;
    sessionDate: string;
    reps?: number;
    load?: number;
  },
): WorkoutSession {
  const reps = partial.reps ?? 8;
  const load = partial.load ?? 60;
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
        id: `${partial.id}-ex`,
        exerciseId: "hack-squat",
        plannedOrder: 0,
        performedOrder: 0,
        status: "completed",
        lastSetRir: null,
        notes: null,
        sets: [
          {
            id: `${partial.id}-set`,
            setNumber: 1,
            load,
            repetitions: reps,
            durationSeconds: null,
            rir: null,
            createdAt: `${partial.sessionDate}T10:30:00.000Z`,
          },
        ],
      },
    ],
  };
}

function listOf(
  rule: { evaluate: (s: ReturnType<typeof AnalyticsService.compute>) => unknown },
  snap: ReturnType<typeof AnalyticsService.compute>,
) {
  const raw = rule.evaluate(snap);
  return (Array.isArray(raw) ? raw : raw ? [raw] : []) as {
    key?: string;
    type: string;
    title: string;
    description: string;
    action?: string;
  }[];
}

function listKeys(
  rule: { evaluate: (s: ReturnType<typeof AnalyticsService.compute>) => unknown },
  snap: ReturnType<typeof AnalyticsService.compute>,
) {
  return listOf(rule, snap).map((i) => i.key);
}

describe("combinedInsightsRule", () => {
  it("detects weight down while training stays active (correlation)", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      weight: [
        weight({ id: "w1", entryDate: "2026-07-01", weightKg: 82 }),
        weight({ id: "w2", entryDate: "2026-07-15", weightKg: 80.5 }),
        weight({ id: "w3", entryDate: "2026-07-31", weightKg: 79 }),
      ],
      workouts: [
        session({ id: "s1", sessionDate: "2026-07-07" }),
        session({ id: "s2", sessionDate: "2026-07-14" }),
        session({ id: "s3", sessionDate: "2026-07-21" }),
        session({ id: "s4", sessionDate: "2026-07-28" }),
        session({ id: "s5", sessionDate: "2026-07-30" }),
      ],
    });
    const hit = listOf(combinedInsightsRule, snap).find(
      (i) => i.key === "weight-down-volume-up",
    );
    expect(hit).toBeTruthy();
    expect(hit!.type).toBe("correlation");
    expect(hit!.title).not.toMatch(/desde que/i);
    expect(hit!.description).not.toMatch(/no implica|causal/i);
    assertCopyLength(hit!);
  });

  it("detects weight and waist both down", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      weight: [
        weight({ id: "w1", entryDate: "2026-07-01", weightKg: 82 }),
        weight({ id: "w2", entryDate: "2026-07-15", weightKg: 80.5 }),
        weight({ id: "w3", entryDate: "2026-07-31", weightKg: 79 }),
      ],
      measurements: [
        measurement({ id: "m1", entryDate: "2026-07-01", waistCm: 92 }),
        measurement({ id: "m2", entryDate: "2026-07-15", waistCm: 90 }),
        measurement({ id: "m3", entryDate: "2026-07-31", waistCm: 88 }),
      ],
    });
    expect(listKeys(combinedInsightsRule, snap)).toContain(
      "weight-waist-both-down",
    );
  });

  it("detects waist down with stable weight", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      weight: [
        weight({ id: "w1", entryDate: "2026-07-01", weightKg: 78.0 }),
        weight({ id: "w2", entryDate: "2026-07-15", weightKg: 78.2 }),
        weight({ id: "w3", entryDate: "2026-07-31", weightKg: 78.1 }),
      ],
      measurements: [
        measurement({ id: "m1", entryDate: "2026-07-01", waistCm: 90 }),
        measurement({ id: "m2", entryDate: "2026-07-15", waistCm: 88 }),
        measurement({ id: "m3", entryDate: "2026-07-31", waistCm: 86 }),
      ],
    });
    expect(listKeys(combinedInsightsRule, snap)).toContain(
      "waist-down-weight-stable",
    );
  });

  it("detects better sleep alongside regular training without false causality", () => {
    const sleepEntries: SleepEntry[] = [];
    for (let day = 1; day <= 30; day++) {
      const d = `2026-07-${String(day).padStart(2, "0")}`;
      const mins = day >= 25 ? 480 : 400;
      sleepEntries.push(
        sleep({ id: `sl-${day}`, entryDate: d, durationMinutes: mins }),
      );
    }

    const workouts: WorkoutSession[] = [];
    for (let i = 0; i < 12; i++) {
      const day = 1 + i * 2;
      workouts.push(
        session({
          id: `w-${i}`,
          sessionDate: `2026-07-${String(Math.min(day, 30)).padStart(2, "0")}`,
        }),
      );
    }

    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      sleep: sleepEntries,
      workouts,
    });
    const hit = listOf(combinedInsightsRule, snap).find(
      (i) => i.key === "sleep-better-training",
    );
    expect(hit).toBeTruthy();
    expect(hit!.type).toBe("correlation");
    expect(hit!.title + hit!.description).toMatch(/coinciden|juntos/i);
    expect(hit!.title).not.toMatch(/desde que/i);
    assertCopyLength(hit!);
  });

  it("never emits steps-up-with-training (replaced)", () => {
    const stepEntries: StepsEntry[] = [];
    for (let day = 1; day <= 30; day++) {
      const d = `2026-07-${String(day).padStart(2, "0")}`;
      const count = day >= 20 ? 11_000 : 7_000;
      stepEntries.push(steps({ id: `st-${day}`, entryDate: d, steps: count }));
    }

    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      steps: stepEntries,
      stepsGoal: 10_000,
      workouts: [
        session({ id: "s1", sessionDate: "2026-07-10" }),
        session({ id: "s2", sessionDate: "2026-07-17" }),
        session({ id: "s3", sessionDate: "2026-07-24" }),
        session({ id: "s4", sessionDate: "2026-07-28" }),
      ],
    });
    expect(listKeys(combinedInsightsRule, snap)).not.toContain(
      "steps-up-with-training",
    );
  });

  it("detects training with fat down", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      weight: [
        weight({
          id: "w1",
          entryDate: "2026-07-01",
          weightKg: 80,
          bodyFatPct: 20,
        }),
        weight({
          id: "w2",
          entryDate: "2026-07-10",
          weightKg: 79.5,
          bodyFatPct: 19.2,
        }),
        weight({
          id: "w3",
          entryDate: "2026-07-20",
          weightKg: 79,
          bodyFatPct: 18.5,
        }),
        weight({
          id: "w4",
          entryDate: "2026-07-31",
          weightKg: 78.5,
          bodyFatPct: 17.8,
        }),
      ],
      workouts: [
        session({ id: "s1", sessionDate: "2026-07-07" }),
        session({ id: "s2", sessionDate: "2026-07-14" }),
        session({ id: "s3", sessionDate: "2026-07-21" }),
        session({ id: "s4", sessionDate: "2026-07-28" }),
        session({ id: "s5", sessionDate: "2026-07-30" }),
      ],
    });
    expect(listKeys(combinedInsightsRule, snap)).toContain("training-fat-down");
  });

  it("detects sleep up with BP down", () => {
    const sleepEntries: SleepEntry[] = [];
    for (let day = 1; day <= 30; day++) {
      const d = `2026-07-${String(day).padStart(2, "0")}`;
      sleepEntries.push(
        sleep({
          id: `sl-${day}`,
          entryDate: d,
          durationMinutes: day >= 24 ? 500 : 400,
        }),
      );
    }
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      sleep: sleepEntries,
      bloodPressure: [
        bp({ id: "b1", entryDate: "2026-07-01", systolic: 132, diastolic: 84 }),
        bp({ id: "b2", entryDate: "2026-07-10", systolic: 128, diastolic: 82 }),
        bp({ id: "b3", entryDate: "2026-07-20", systolic: 124, diastolic: 80 }),
        bp({ id: "b4", entryDate: "2026-07-31", systolic: 118, diastolic: 76 }),
      ],
    });
    expect(listKeys(combinedInsightsRule, snap)).toContain("sleep-up-bp-down");
  });

  it("detects soft performance with short sleep", () => {
    const sleepEntries: SleepEntry[] = [];
    for (let day = 1; day <= 14; day++) {
      const d = `2026-07-${String(day).padStart(2, "0")}`;
      sleepEntries.push(
        sleep({
          id: `sl-${day}`,
          entryDate: d,
          durationMinutes: day >= 8 ? 320 : 420,
        }),
      );
    }
    // Early high volume, recent soft week
    const workouts: WorkoutSession[] = [];
    for (let i = 0; i < 8; i++) {
      workouts.push(
        session({
          id: `early-${i}`,
          sessionDate: `2026-06-${String(10 + i).padStart(2, "0")}`,
          load: 80,
          reps: 8,
        }),
      );
    }
    workouts.push(
      session({ id: "late-1", sessionDate: "2026-07-12", load: 40, reps: 6 }),
    );

    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-14",
      sleep: sleepEntries,
      workouts,
    });
    expect(listKeys(combinedInsightsRule, snap)).toContain(
      "soft-perf-short-sleep",
    );
  });
});

describe("killed metric-echo / medical rules", () => {
  it("does not emit BP mean-in-optimal or several-elevated", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      bloodPressure: [
        bp({ id: "b1", entryDate: "2026-07-01", systolic: 118, diastolic: 74 }),
        bp({ id: "b2", entryDate: "2026-07-08", systolic: 116, diastolic: 72 }),
        bp({ id: "b3", entryDate: "2026-07-15", systolic: 119, diastolic: 75 }),
        bp({ id: "b4", entryDate: "2026-07-22", systolic: 117, diastolic: 73 }),
        bp({ id: "b5", entryDate: "2026-07-31", systolic: 118, diastolic: 74 }),
      ],
    });
    const keys = listKeys(bloodPressureInsightsRule, snap);
    expect(keys).not.toContain("mean-optimal");
    expect(keys).not.toContain("several-elevated");
  });

  it("does not emit bare new body-fat min", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      weight: [
        weight({
          id: "w1",
          entryDate: "2026-06-01",
          weightKg: 80,
          bodyFatPct: 20,
        }),
        weight({
          id: "w2",
          entryDate: "2026-06-15",
          weightKg: 79.5,
          bodyFatPct: 19,
        }),
        weight({
          id: "w3",
          entryDate: "2026-07-01",
          weightKg: 79,
          bodyFatPct: 18,
        }),
        weight({
          id: "w4",
          entryDate: "2026-07-30",
          weightKg: 78.5,
          bodyFatPct: 17.5,
        }),
      ],
    });
    expect(listKeys(bodyFatInsightsRule, snap)).not.toContain("new-min");
  });
});

describe("behavioral warnings", () => {
  it("warns after several days without weight log", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      weight: [
        weight({ id: "w1", entryDate: "2026-07-01", weightKg: 80 }),
        weight({ id: "w2", entryDate: "2026-07-10", weightKg: 79.5 }),
        weight({ id: "w3", entryDate: "2026-07-20", weightKg: 79 }),
      ],
    });
    const hit = listOf(weightInsightsRule, snap).find((i) => i.key === "log-gap");
    expect(hit).toBeTruthy();
    expect(hit!.type).toBe("warning");
    expect(hit!.action).toMatch(/Traza|anota/i);
  });

  it("warns after weeks without measurements", () => {
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      measurements: [
        measurement({ id: "m1", entryDate: "2026-06-01", waistCm: 90 }),
        measurement({ id: "m2", entryDate: "2026-06-20", waistCm: 89 }),
      ],
    });
    const hit = listOf(measurementInsightsRule, snap).find(
      (i) => i.key === "meas-gap",
    );
    expect(hit).toBeTruthy();
    expect(hit!.type).toBe("warning");
  });

  it("warns when activity drops ≥20% vs month", () => {
    const stepEntries: StepsEntry[] = [];
    for (let day = 1; day <= 30; day++) {
      const d = `2026-07-${String(day).padStart(2, "0")}`;
      stepEntries.push(
        steps({
          id: `st-${day}`,
          entryDate: d,
          steps: day >= 25 ? 5_000 : 10_000,
        }),
      );
    }
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      steps: stepEntries,
      stepsGoal: 10_000,
    });
    const hit = listOf(stepsInsightsRule, snap).find(
      (i) => i.key === "activity-drop",
    );
    expect(hit).toBeTruthy();
    expect(hit!.type).toBe("warning");
    expect(hit!.action).toBeTruthy();
  });
});

describe("recommendations", () => {
  it("recommends rest after several short nights", () => {
    const sleepEntries: SleepEntry[] = [];
    for (let day = 1; day <= 14; day++) {
      const d = `2026-07-${String(day).padStart(2, "0")}`;
      sleepEntries.push(
        sleep({
          id: `sl-${day}`,
          entryDate: d,
          durationMinutes: day >= 8 ? 330 : 420,
        }),
      );
    }
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-14",
      sleep: sleepEntries,
    });
    const hit = listOf(sleepInsightsRule, snap).find(
      (i) => i.key === "short-nights",
    );
    expect(hit).toBeTruthy();
    expect(hit!.type).toBe("recommendation");
    expect(hit!.action).toBeTruthy();
    assertCopyLength(hit!);
  });

  it("recommends concrete load bump when reps hit catalog top", () => {
    const workouts: WorkoutSession[] = [
      session({ id: "s1", sessionDate: "2026-07-10", reps: 8, load: 50 }),
      session({ id: "s2", sessionDate: "2026-07-17", reps: 9, load: 52.5 }),
      session({ id: "s3", sessionDate: "2026-07-24", reps: 10, load: 55 }),
      session({ id: "s4", sessionDate: "2026-07-30", reps: 10, load: 55 }),
    ];
    const snap = AnalyticsService.compute({
      asOfDate: "2026-07-31",
      workouts,
    });
    const hit = listOf(workoutInsightsRule, snap).find(
      (i) => i.key === "try-load-increase",
    );
    expect(hit).toBeTruthy();
    expect(hit!.type).toBe("recommendation");
    expect(hit!.action).toMatch(/2[,.]5|kg/i);
    expect(hit!.title.length).toBeLessThanOrEqual(TITLE_MAX);
    assertCopyLength(hit!);
  });
});
