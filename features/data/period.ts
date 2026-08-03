import {
  format,
  parseISO,
  startOfYear,
  subDays,
} from "date-fns";
import type { DateRange, ExportPeriodPreset } from "./schema";

export function todayIsoDate(now = new Date()): string {
  return format(now, "yyyy-MM-dd");
}

export function resolveExportRange(
  preset: ExportPeriodPreset,
  custom?: Partial<DateRange>,
  now = new Date(),
): DateRange {
  const endDate = todayIsoDate(now);

  switch (preset) {
    case "7d":
      return { startDate: format(subDays(now, 6), "yyyy-MM-dd"), endDate };
    case "30d":
      return { startDate: format(subDays(now, 29), "yyyy-MM-dd"), endDate };
    case "90d":
      return { startDate: format(subDays(now, 89), "yyyy-MM-dd"), endDate };
    case "year":
      return { startDate: format(startOfYear(now), "yyyy-MM-dd"), endDate };
    case "all":
      return { startDate: "1970-01-01", endDate };
    case "custom": {
      const start = custom?.startDate?.trim() || endDate;
      const end = custom?.endDate?.trim() || endDate;
      return start <= end
        ? { startDate: start, endDate: end }
        : { startDate: end, endDate: start };
    }
    default:
      return { startDate: format(subDays(now, 29), "yyyy-MM-dd"), endDate };
  }
}

export function isDateInRange(dateIso: string, range: DateRange): boolean {
  if (!dateIso || dateIso.length < 10) return false;
  const day = dateIso.slice(0, 10);
  return day >= range.startDate && day <= range.endDate;
}

export function formatRangeLabelEs(range: DateRange, preset: ExportPeriodPreset): string {
  if (preset === "all") return "Todo el historial";
  if (preset === "year") return `Año ${range.startDate.slice(0, 4)}`;
  try {
    const start = parseISO(range.startDate);
    const end = parseISO(range.endDate);
    return `${format(start, "d MMM yyyy")} – ${format(end, "d MMM yyyy")}`;
  } catch {
    return `${range.startDate} – ${range.endDate}`;
  }
}

export const PERIOD_PRESET_LABELS_ES: Record<ExportPeriodPreset, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
  year: "Año en curso",
  all: "Todo",
  custom: "Rango personalizado",
};
