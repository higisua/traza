"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AnalyticsService, type AnalyticsPeriod } from "@/features/analytics";
import { InsightsService } from "@/features/insights";
import { WeightRepository } from "@/features/weight/WeightRepository";
import { BloodPressureRepository } from "@/features/blood-pressure/BloodPressureRepository";
import { SleepRepository } from "@/features/sleep/SleepRepository";
import { StepsRepository } from "@/features/steps/StepsRepository";
import { MeasurementRepository } from "@/features/measurements/MeasurementRepository";
import { buildProgressChartSeries } from "./buildProgressChartSeries";
import { buildProgressViewModel } from "./buildProgressViewModel";
import { useProgressPeriod } from "./useProgressPeriod";

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Live Progress data: one Analytics snapshot + Insights, memoized by period.
 * Re-subscribes to tracking repositories so edits elsewhere refresh the view.
 */
export function useProgressData() {
  const isClient = useIsClient();
  const { period, setPeriod } = useProgressPeriod();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isClient) return;
    const bump = () => setTick((value) => value + 1);
    const unsubs = [
      WeightRepository.subscribe(bump),
      BloodPressureRepository.subscribe(bump),
      SleepRepository.subscribe(bump),
      StepsRepository.subscribe(bump),
      MeasurementRepository.subscribe(bump),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [isClient]);

  const snapshot = useMemo(() => {
    if (!isClient) return null;
    void tick;
    return AnalyticsService.getSnapshot();
  }, [isClient, tick]);

  const insights = useMemo(() => {
    if (!snapshot) return null;
    return InsightsService.fromSnapshot(snapshot);
  }, [snapshot]);

  const charts = useMemo(() => {
    if (!snapshot) return null;
    return buildProgressChartSeries(period, snapshot.asOfDate);
  }, [snapshot, period]);

  const viewModel = useMemo(() => {
    if (!snapshot || !insights || !charts) return null;
    return buildProgressViewModel({
      snapshot,
      insights,
      period,
      charts,
    });
  }, [snapshot, insights, charts, period]);

  return {
    hydrated: isClient,
    period,
    setPeriod: setPeriod as (period: AnalyticsPeriod) => void,
    snapshot,
    charts,
    viewModel,
  };
}
