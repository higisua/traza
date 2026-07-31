import { describe, expect, it } from "vitest";
import {
  computeExerciseRecords,
  evaluateSetRecords,
} from "../prCompute";
import type { WorkoutSession, WorkoutSet } from "@/lib/storage/trainingStorage";

function makeSession(
  id: string,
  date: string,
  exerciseId: string,
  load: number,
  reps: number,
): WorkoutSession {
  return {
    id,
    templateId: null,
    templateVersionId: null,
    sessionDate: date,
    startTime: "10:00",
    endTime: "11:00",
    durationMinutes: 45,
    status: "completed",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    exercises: [
      {
        id: `${id}-ex`,
        exerciseId,
        plannedOrder: 0,
        performedOrder: 0,
        status: "completed",
        lastSetRir: null,
        notes: null,
        sets: [
          {
            id: `${id}-set`,
            setNumber: 1,
            load,
            repetitions: reps,
            durationSeconds: null,
            createdAt: `${date}T10:15:00.000Z`,
          },
        ],
      },
    ],
  };
}

describe("prCompute", () => {
  const sessions = [
    makeSession("a", "2026-07-01", "squat", 100, 5),
    makeSession("b", "2026-07-15", "squat", 110, 3),
  ];

  it("computes all-time records from sessions", () => {
    const records = computeExerciseRecords(sessions, "squat");
    expect(records.find((r) => r.kind === "max_load")?.load).toBe(110);
    expect(records.find((r) => r.kind === "max_reps")?.repetitions).toBe(5);
    expect(records.find((r) => r.kind === "max_volume")?.volumeKg).toBe(500);
  });

  it("evaluates a live set against prior history", () => {
    const set: WorkoutSet = {
      id: "live",
      setNumber: 1,
      load: 120,
      repetitions: 2,
      durationSeconds: null,
      createdAt: "2026-07-20T10:00:00.000Z",
    };
    expect(evaluateSetRecords(sessions, "squat", set)).toContain("max_load");
    expect(
      evaluateSetRecords(sessions, "squat", {
        ...set,
        load: 90,
        repetitions: 2,
      }),
    ).toEqual([]);
  });
});
