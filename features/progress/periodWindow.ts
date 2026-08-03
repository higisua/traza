import { periodDays, type AnalyticsPeriod } from "@/features/analytics";
import { addCalendarDays } from "@/features/analytics/core";

/** Inclusive calendar start for a rolling window; null means full history. */
export function periodStartDate(
  period: AnalyticsPeriod,
  asOfDate: string,
): string | null {
  const days = periodDays(period);
  if (days == null) return null;
  return addCalendarDays(asOfDate, -days);
}

export function isDateInPeriod(
  entryDate: string,
  period: AnalyticsPeriod,
  asOfDate: string,
): boolean {
  if (entryDate > asOfDate) return false;
  const start = periodStartDate(period, asOfDate);
  if (start == null) return true;
  return entryDate >= start;
}

/** Chart sample budget by period — denser windows keep more recent points. */
export function chartPointLimit(period: AnalyticsPeriod): number {
  switch (period) {
    case "7d":
      return 14;
    case "30d":
      return 32;
    case "90d":
      return 90;
    case "all":
      return 120;
  }
}
