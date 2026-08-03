"use client";

import { useSyncExternalStore } from "react";
import type { AnalyticsPeriod } from "@/features/analytics";
import {
  getProgressPeriod,
  setProgressPeriod,
  subscribeProgressPeriod,
} from "./ProgressPeriodStore";

export function useProgressPeriod(): {
  period: AnalyticsPeriod;
  setPeriod: (period: AnalyticsPeriod) => void;
} {
  const period = useSyncExternalStore(
    subscribeProgressPeriod,
    getProgressPeriod,
    () => "30d" as AnalyticsPeriod,
  );

  return { period, setPeriod: setProgressPeriod };
}
