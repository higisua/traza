export type {
  CalendarDayNavIntent,
  CalendarModuleKey,
  CalendarModuleOpenIntent,
  DayPresence,
  DaySummaryBlock,
  MonthCell,
  SelectedDayHeading,
} from "./CalendarTypes";
export { CALENDAR_MODULES } from "./CalendarTypes";
export {
  buildPresenceByDate,
  monthHasAnyPresence,
  presenceForDate,
} from "./aggregateMonthPresence";
export { buildMonthGrid, monthPrefix } from "./buildMonthGrid";
export {
  buildDaySummary,
  formatSelectedDayHeading,
  type DaySummarySources,
} from "./buildDaySummary";
export { useCalendarPresence } from "./useCalendarPresence";
export { useCalendarDaySelection } from "./useCalendarDaySelection";
export { useCalendarDaySummary } from "./useCalendarDaySummary";
export { useCalendarMonth } from "./useCalendarMonth";
