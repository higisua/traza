"use client";

import { useCallback, useMemo } from "react";
import { useRepositoryEntries } from "@/lib/tracking/useRepositoryEntries";
import { StepsRepository } from "./StepsRepository";
import { StepsService } from "./StepsService";
import type {
  StepsChartPoint,
  StepsEntry,
  StepsEntryInput,
  StepsSummary,
} from "./StepsTypes";

const EMPTY_ENTRIES: StepsEntry[] = [];

export function useStepsEntries() {
  const entries = useRepositoryEntries(
    StepsRepository,
    "step_entries",
    EMPTY_ENTRIES,
  );

  const summary = useMemo<StepsSummary>(
    () => StepsService.getSummary(),
    [entries],
  );
  const chartPoints = useMemo<StepsChartPoint[]>(
    () => StepsService.getChartPoints(),
    [entries],
  );

  const create = useCallback((input: StepsEntryInput) => {
    return StepsService.create(input);
  }, []);

  const update = useCallback((id: string, input: StepsEntryInput) => {
    return StepsService.update(id, input);
  }, []);

  const remove = useCallback((id: string) => {
    return StepsService.remove(id);
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
