import { readJson, storageKey, writeJson } from "@/lib/storage/localStorage";
import type { AnalyticsPeriod } from "@/features/analytics";

const PERIOD_KEY = storageKey("progress_period");
const DEFAULT_PERIOD: AnalyticsPeriod = "30d";

const VALID: ReadonlySet<AnalyticsPeriod> = new Set([
  "7d",
  "30d",
  "90d",
  "all",
]);

const listeners = new Set<() => void>();

function isPeriod(value: unknown): value is AnalyticsPeriod {
  return typeof value === "string" && VALID.has(value as AnalyticsPeriod);
}

export function getProgressPeriod(): AnalyticsPeriod {
  const stored = readJson<unknown>(PERIOD_KEY, DEFAULT_PERIOD);
  return isPeriod(stored) ? stored : DEFAULT_PERIOD;
}

export function setProgressPeriod(period: AnalyticsPeriod): void {
  if (!VALID.has(period)) return;
  writeJson(PERIOD_KEY, period);
  for (const listener of listeners) listener();
}

export function subscribeProgressPeriod(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
