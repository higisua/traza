"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { WeightRepository } from "./WeightRepository";
import { WeightService } from "./WeightService";
import type {
  WeightChartPoint,
  WeightEntry,
  WeightEntryInput,
  WeightSummary,
} from "./WeightTypes";

const EMPTY_ENTRIES: WeightEntry[] = [];

function subscribe(onStoreChange: () => void) {
  const unsubscribe = WeightRepository.subscribe(onStoreChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key.includes("weight_entries")) {
      WeightRepository.refresh();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    unsubscribe();
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getSnapshot(): WeightEntry[] {
  return WeightRepository.getAll();
}

function getServerSnapshot(): WeightEntry[] {
  return EMPTY_ENTRIES;
}

export function useWeightEntries() {
  const entries = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
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
