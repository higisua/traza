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
  buildDaySummary,
  formatSelectedDayHeading,
  type DaySummarySources,
} from "./buildDaySummary";
import type {
  DaySummaryBlock,
  SelectedDayHeading,
} from "./CalendarTypes";

const SESSIONS_KEY = storageKey("workout_sessions");
const EMPTY_SESSIONS: ReturnType<typeof trainingStorage.getSessions> = [];

let sessionsSnapshot = EMPTY_SESSIONS;
let sessionsSnapshotKey = "";

function readTrainingSessions() {
  const sessions = trainingStorage
    .getSessions()
    .filter((session) => session.status !== "cancelled");
  const key = sessions.map((s) => `${s.id}:${s.updatedAt}`).join("|");
  if (key === sessionsSnapshotKey) {
    return sessionsSnapshot;
  }
  sessionsSnapshotKey = key;
  sessionsSnapshot = sessions.length === 0 ? EMPTY_SESSIONS : sessions;
  return sessionsSnapshot;
}

function subscribeTrainingSessions(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const onStorage = (event: StorageEvent) => {
    if (!event.key || event.key === SESSIONS_KEY) {
      sessionsSnapshotKey = "";
      onStoreChange();
    }
  };

  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

/**
 * Read-only day summary from existing module hooks / trainingStorage.
 * Never writes or duplicates records.
 */
export function useCalendarDaySummary(date: string | null): {
  heading: SelectedDayHeading | null;
  blocks: DaySummaryBlock[];
} {
  const { entries: weight } = useWeightEntries();
  const { entries: bloodPressure } = useBloodPressureEntries();
  const { entries: sleep } = useSleepEntries();
  const { entries: steps } = useStepsEntries();
  const { entries: measurements } = useMeasurementEntries();

  const training = useSyncExternalStore(
    subscribeTrainingSessions,
    readTrainingSessions,
    () => EMPTY_SESSIONS,
  );

  const sources = useMemo<DaySummarySources>(
    () => ({
      weight,
      bloodPressure,
      sleep,
      steps,
      measurements,
      training,
    }),
    [weight, bloodPressure, sleep, steps, measurements, training],
  );

  return useMemo(() => {
    if (!date) {
      return { heading: null, blocks: [] };
    }
    return {
      heading: formatSelectedDayHeading(date),
      blocks: buildDaySummary(date, sources),
    };
  }, [date, sources]);
}
