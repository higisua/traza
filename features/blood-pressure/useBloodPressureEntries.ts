"use client";

import { useCallback, useMemo } from "react";
import { useRepositoryEntries } from "@/lib/tracking/useRepositoryEntries";
import { BloodPressureRepository } from "./BloodPressureRepository";
import { BloodPressureService } from "./BloodPressureService";
import type {
  BloodPressureChartPoint,
  BloodPressureEntry,
  BloodPressureEntryInput,
  BloodPressureSummary,
} from "./BloodPressureTypes";

const EMPTY_ENTRIES: BloodPressureEntry[] = [];

export function useBloodPressureEntries() {
  const entries = useRepositoryEntries(
    BloodPressureRepository,
    "blood_pressure_entries",
    EMPTY_ENTRIES,
  );

  const summary = useMemo<BloodPressureSummary>(
    () => BloodPressureService.getSummary(),
    [entries],
  );
  const chartPoints = useMemo<BloodPressureChartPoint[]>(
    () => BloodPressureService.getChartPoints(),
    [entries],
  );

  const create = useCallback((input: BloodPressureEntryInput) => {
    return BloodPressureService.create(input);
  }, []);

  const update = useCallback((id: string, input: BloodPressureEntryInput) => {
    return BloodPressureService.update(id, input);
  }, []);

  const remove = useCallback((id: string) => {
    return BloodPressureService.remove(id);
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
