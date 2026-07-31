/**
 * Calendar presence + day summary — temporal navigator for physical state.
 * Presence marks which modules have data; summary surfaces values for the selected day.
 */

/** Fixed slot order for presence marks and day-summary rows. */
export const CALENDAR_MODULES = [
  "weight",
  "bloodPressure",
  "sleep",
  "steps",
  "measurements",
  "training",
] as const;

export type CalendarModuleKey = (typeof CALENDAR_MODULES)[number];

export type DayPresence = {
  /** YYYY-MM-DD */
  date: string;
  modules: readonly CalendarModuleKey[];
};

export type MonthCell = {
  /** YYYY-MM-DD */
  date: string;
  dayOfMonth: number;
  inCurrentMonth: boolean;
  isToday: boolean;
  presence: DayPresence;
};

/**
 * Future seam: block press → open module (not a full-day screen).
 * Phase 2.1 prepares the intent without forcing navigation.
 */
export type CalendarModuleOpenIntent = {
  date: string;
  module: CalendarModuleKey;
  /** Module route when navigation becomes natural later. */
  href: string | null;
};

/** @deprecated Prefer CalendarModuleOpenIntent — kept for month-selection seam. */
export type CalendarDayNavIntent = {
  date: string;
  presence: DayPresence;
};

/** Selected-day heading — weekday hierarchy feels like entering that day. */
export type SelectedDayHeading = {
  weekday: string;
  dateLabel: string;
};

/**
 * Day summary card model — content structure adapts per module
 * (primary + optional secondary), not a single identical template line.
 */
export type DaySummaryBlock = {
  module: CalendarModuleKey;
  label: string;
  primary: string | null;
  secondary: string | null;
  recorded: boolean;
  href: string | null;
};
