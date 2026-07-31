"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useWeightEntries } from "@/features/weight";
import { useBloodPressureEntries } from "@/features/blood-pressure";
import { useSleepEntries } from "@/features/sleep";
import { useStepsEntries } from "@/features/steps";
import { useMeasurementEntries } from "@/features/measurements";
import { trainingStorage } from "@/lib/storage/trainingStorage";
import { storageKey } from "@/lib/storage/localStorage";
import {
  buildPresenceByDate,
  type PresenceSourceDates,
} from "./aggregateMonthPresence";
import type { DayPresence } from "./CalendarTypes";

const SESSIONS_KEY = storageKey("workout_sessions");
const EMPTY_TRAINING: string[] = [];

let trainingSnapshot: string[] = EMPTY_TRAINING;
let trainingSnapshotKey = "";

function readTrainingSessionDates(): string[] {
  const dates = [
    ...new Set(
      trainingStorage
        .getSessions()
        .filter((session) => session.status !== "cancelled")
        .map((session) => session.sessionDate),
    ),
  ].sort();
  const key = dates.join("|");
  if (key === trainingSnapshotKey) {
    return trainingSnapshot;
  }
  trainingSnapshotKey = key;
  trainingSnapshot = dates.length === 0 ? EMPTY_TRAINING : dates;
  return trainingSnapshot;
}

function subscribeTrainingSessions(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SESSIONS_KEY) {
      trainingSnapshotKey = "";
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/**
 * Aggregates date presence from existing module repositories / storage.
 * Read-only — never writes or duplicates records.
 */
export function useCalendarPresence(): Map<string, DayPresence> {
  const { entries: weight } = useWeightEntries();
  const { entries: bloodPressure } = useBloodPressureEntries();
  const { entries: sleep } = useSleepEntries();
  const { entries: steps } = useStepsEntries();
  const { entries: measurements } = useMeasurementEntries();

  const trainingDates = useSyncExternalStore(
    subscribeTrainingSessions,
    readTrainingSessionDates,
    () => EMPTY_TRAINING,
  );

  const sources = useMemo<PresenceSourceDates>(
    () => ({
      training: trainingDates,
      weight: weight.map((e) => e.entryDate),
      bloodPressure: bloodPressure.map((e) => e.entryDate),
      sleep: sleep.map((e) => e.entryDate),
      steps: steps.map((e) => e.entryDate),
      measurements: measurements.map((e) => e.entryDate),
    }),
    [trainingDates, weight, bloodPressure, sleep, steps, measurements],
  );

  return useMemo(() => buildPresenceByDate(sources), [sources]);
}
