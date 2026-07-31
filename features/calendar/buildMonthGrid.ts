import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { DayPresence, MonthCell } from "./CalendarTypes";
import { presenceForDate } from "./aggregateMonthPresence";

const WEEK_STARTS_ON = 1 as const; // Monday — Spain

export function buildMonthGrid(
  visibleMonth: Date,
  presenceByDate: Map<string, DayPresence>,
): MonthCell[] {
  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });

  const cells: MonthCell[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const date = format(cursor, "yyyy-MM-dd");
    cells.push({
      date,
      dayOfMonth: cursor.getDate(),
      inCurrentMonth: isSameMonth(cursor, visibleMonth),
      isToday: isToday(cursor),
      presence: presenceForDate(presenceByDate, date),
    });
    cursor = addDays(cursor, 1);
  }

  return cells;
}

export function monthPrefix(visibleMonth: Date): string {
  return format(visibleMonth, "yyyy-MM");
}
