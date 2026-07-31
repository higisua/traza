"use client";

import { useCallback, useMemo } from "react";
import { useRepositoryEntries } from "@/lib/tracking/useRepositoryEntries";
import { MeasurementRepository } from "./MeasurementRepository";
import { MeasurementService } from "./MeasurementService";
import type {
  MeasurementChartPoint,
  MeasurementEntry,
  MeasurementEntryInput,
  MeasurementSummary,
} from "./MeasurementTypes";

const EMPTY_ENTRIES: MeasurementEntry[] = [];

export function useMeasurementEntries() {
  const entries = useRepositoryEntries(
    MeasurementRepository,
    "body_measurements",
    EMPTY_ENTRIES,
  );

  const summary = useMemo<MeasurementSummary>(
    () => MeasurementService.getSummary(),
    [entries],
  );
  const chartPoints = useMemo<MeasurementChartPoint[]>(
    () => MeasurementService.getChartPoints(),
    [entries],
  );

  const create = useCallback((input: MeasurementEntryInput) => {
    return MeasurementService.create(input);
  }, []);

  const update = useCallback((id: string, input: MeasurementEntryInput) => {
    return MeasurementService.update(id, input);
  }, []);

  const remove = useCallback((id: string) => {
    return MeasurementService.remove(id);
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
