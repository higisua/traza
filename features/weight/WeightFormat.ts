import {
  formatChartDayLabel,
  formatDateTimeChip,
  formatEntryStamp,
  nowDateInputValue,
  nowTimeInputValue,
  toOccurredAt,
} from "@/lib/tracking/dateTime";
import { parseLocaleNumber } from "@/lib/tracking/input";
import type { WeightEntry, WeightTrendDirection } from "./WeightTypes";

export {
  formatDateTimeChip,
  nowDateInputValue,
  nowTimeInputValue,
  parseLocaleNumber,
  toOccurredAt,
};

export function formatWeightKg(value: number): string {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatBodyFatPct(value: number): string {
  return value.toLocaleString("es-ES", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Home / summary meta */
export function formatEntryRelativeMeta(entry: WeightEntry): string {
  return formatEntryStamp(entry);
}

export function formatHistoryStamp(entry: WeightEntry): string {
  return formatEntryStamp(entry);
}

export function formatSignedDeltaKg(delta: number): string {
  const abs = formatWeightKg(Math.abs(delta));
  if (Math.abs(delta) < 0.01) return `→ ${abs} kg`;
  return `${delta > 0 ? "↑" : "↓"} ${delta > 0 ? "+" : "−"}${abs} kg`;
}

export function formatSignedDeltaBodyFat(delta: number): string {
  const abs = formatBodyFatPct(Math.abs(delta));
  if (Math.abs(delta) < 0.05) return `→ ${abs} %`;
  return `${delta > 0 ? "↑" : "↓"} ${delta > 0 ? "+" : "−"}${abs} %`;
}

export function formatChartLabel(
  entry: Pick<WeightEntry, "entryDate" | "occurredAt">,
): string {
  return formatChartDayLabel(entry);
}

export function trendSymbol(direction: WeightTrendDirection): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  if (direction === "flat") return "→";
  return "";
}
