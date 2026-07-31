"use client";

import { useCallback, useMemo } from "react";
import { useRepositoryEntries } from "@/lib/tracking/useRepositoryEntries";
import { SleepRepository } from "./SleepRepository";
import { SleepService } from "./SleepService";
import type {
  SleepChartPoint,
  SleepEntry,
  SleepEntryInput,
  SleepSummary,
} from "./SleepTypes";

const EMPTY_ENTRIES: SleepEntry[] = [];

export function useSleepEntries() {
  const entries = useRepositoryEntries(
    SleepRepository,
    "sleep_entries",
    EMPTY_ENTRIES,
  );

  const summary = useMemo<SleepSummary>(
    () => SleepService.getSummary(),
    [entries],
  );
  const chartPoints = useMemo<SleepChartPoint[]>(
    () => SleepService.getChartPoints(),
    [entries],
  );

  const create = useCallback((input: SleepEntryInput) => {
    return SleepService.create(input);
  }, []);

  const update = useCallback((id: string, input: SleepEntryInput) => {
    return SleepService.update(id, input);
  }, []);

  const remove = useCallback((id: string) => {
    return SleepService.remove(id);
  }, []);

  return {
    entries,
    summary,
    chartPoints,
    create,
    update,
    remove,
  };
}
