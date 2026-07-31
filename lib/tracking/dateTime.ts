import {
  format,
  isToday,
  isYesterday,
  parse,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";

export type TimedEntryStamp = {
  entryDate: string;
  entryTime?: string;
  occurredAt?: string;
};

function entryDateObject(entry: TimedEntryStamp): Date {
  if (entry.occurredAt) {
    const fromIso = parseISO(entry.occurredAt);
    if (!Number.isNaN(fromIso.getTime())) return fromIso;
  }
  return parse(entry.entryDate, "yyyy-MM-dd", new Date());
}

/** "Hoy · 07:08" / "Ayer · 07:08" / "30 jul · 07:08" */
export function formatEntryStamp(entry: TimedEntryStamp): string {
  const date = entryDateObject(entry);
  const time = entry.entryTime ?? format(date, "HH:mm");

  if (isToday(date)) return `Hoy · ${time}`;
  if (isYesterday(date)) return `Ayer · ${time}`;
  return `${format(date, "d MMM", { locale: es })} · ${time}`;
}

export function formatDateTimeChip(entryDate: string, entryTime: string): string {
  return formatEntryStamp({ entryDate, entryTime });
}

export function formatChartDayLabel(entry: TimedEntryStamp): string {
  return format(entryDateObject(entry), "d MMM", { locale: es });
}

export function nowDateInputValue(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export function nowTimeInputValue(date = new Date()): string {
  return format(date, "HH:mm");
}

export function toOccurredAt(entryDate: string, entryTime: string): string {
  const parsed = parse(
    `${entryDate} ${entryTime}`,
    "yyyy-MM-dd HH:mm",
    new Date(),
  );
  if (Number.isNaN(parsed.getTime())) {
    return `${entryDate}T${entryTime}:00`;
  }
  return parsed.toISOString();
}

export function compareByOccurredAt<
  T extends { occurredAt: string; updatedAt: string },
>(a: T, b: T): number {
  const byOccurred = b.occurredAt.localeCompare(a.occurredAt);
  if (byOccurred !== 0) return byOccurred;
  return b.updatedAt.localeCompare(a.updatedAt);
}

export function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const [y, m, d] = value.split("-").map(Number);
  return (
    date.getFullYear() === y &&
    date.getMonth() + 1 === m &&
    date.getDate() === d
  );
}

export function isValidTimeInput(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function isNotFutureDate(entryDate: string): boolean {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const selected = new Date(`${entryDate}T12:00:00`);
  return selected.getTime() <= endOfToday.getTime();
}
