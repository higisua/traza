"use client";

import { useCallback, useMemo } from "react";
import { useRepositoryEntries } from "@/lib/tracking/useRepositoryEntries";
import { WeightRepository } from "./WeightRepository";
import { WeightService } from "./WeightService";
import type {
  WeightChartPoint,
  WeightEntry,
  WeightEntryInput,
  WeightSummary,
} from "./WeightTypes";

const EMPTY_ENTRIES: WeightEntry[] = [];

export function useWeightEntries() {
  const entries = useRepositoryEntries(
    WeightRepository,
    "weight_entries",
    EMPTY_ENTRIES,
  );

  const summary = useMemo<WeightSummary>(
    () => WeightService.getSummary(),
    [entries],
  );
  const chartPoints = useMemo<WeightChartPoint[]>(
    () => WeightService.getChartPoints(),
    [entries],
  );

  const create = useCallback((input: WeightEntryInput) => {
    return WeightService.create(input);
  }, []);

  const update = useCallback((id: string, input: WeightEntryInput) => {
    return WeightService.update(id, input);
  }, []);

  const remove = useCallback((id: string) => {
    return WeightService.remove(id);
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
