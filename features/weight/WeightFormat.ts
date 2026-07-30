import {
  format,
  isToday,
  isYesterday,
  parse,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import type { WeightEntry, WeightTrendDirection } from "./WeightTypes";

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

export function parseLocaleNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function toOccurredAt(entryDate: string, entryTime: string): string {
  const parsed = parse(`${entryDate} ${entryTime}`, "yyyy-MM-dd HH:mm", new Date());
  if (Number.isNaN(parsed.getTime())) {
    return `${entryDate}T${entryTime}:00`;
  }
  return parsed.toISOString();
}

export function nowDateInputValue(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function nowTimeInputValue(date = new Date()): string {
  return format(date, "HH:mm");
}

function entryDateObject(entry: Pick<WeightEntry, "entryDate" | "occurredAt">): Date {
  const fromIso = parseISO(entry.occurredAt);
  if (!Number.isNaN(fromIso.getTime())) return fromIso;
  return parse(entry.entryDate, "yyyy-MM-dd", new Date());
}

/** Home / summary meta: "Hoy · 07:08" */
export function formatEntryRelativeMeta(entry: WeightEntry): string {
  const date = entryDateObject(entry);
  const time = entry.entryTime;

  if (isToday(date)) return `Hoy · ${time}`;
  if (isYesterday(date)) return `Ayer · ${time}`;

  return `${format(date, "d MMM", { locale: es })} · ${time}`;
}

/** History stamp: "Hoy · 19:38" / "Ayer · 19:38" / "30 jul · 19:38" */
export function formatHistoryStamp(entry: WeightEntry): string {
  return formatEntryRelativeMeta(entry);
}

/** Compact chip for create/edit sheet */
export function formatDateTimeChip(entryDate: string, entryTime: string): string {
  const date = parse(entryDate, "yyyy-MM-dd", new Date());
  if (Number.isNaN(date.getTime())) return `${entryDate} · ${entryTime}`;

  if (isToday(date)) return `Hoy · ${entryTime}`;
  if (isYesterday(date)) return `Ayer · ${entryTime}`;
  return `${format(date, "d MMM", { locale: es })} · ${entryTime}`;
}

export function formatSignedDeltaKg(delta: number): string {
  const abs = formatWeightKg(Math.abs(delta));
  if (Math.abs(delta) < 0.01) return `→ ${abs} kg`;
  return `${delta > 0 ? "↑" : "↓"} ${delta > 0 ? "+" : "-"}${abs} kg`;
}

export function formatSignedDeltaBodyFat(delta: number): string {
  const abs = formatBodyFatPct(Math.abs(delta));
  if (Math.abs(delta) < 0.05) return `→ ${abs} %`;
  return `${delta > 0 ? "↑" : "↓"} ${delta > 0 ? "+" : "-"}${abs} %`;
}

export function formatChartLabel(entry: Pick<WeightEntry, "entryDate" | "occurredAt">): string {
  const date = entryDateObject(entry);
  return format(date, "d MMM", { locale: es });
}

export function trendSymbol(direction: WeightTrendDirection): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  if (direction === "flat") return "→";
  return "";
}
