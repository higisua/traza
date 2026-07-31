/**
 * Calendar-day and calendar-week streak helpers.
 * Dates are YYYY-MM-DD. Inputs need not be sorted or unique.
 */

function parseDay(date: string): number {
  // UTC noon avoids DST edge cases for day arithmetic.
  return Date.parse(`${date}T12:00:00Z`);
}

function dayDiff(a: string, b: string): number {
  return Math.round((parseDay(a) - parseDay(b)) / 86_400_000);
}

function addDays(date: string, days: number): string {
  const ms = parseDay(date) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** Unique sorted ascending YYYY-MM-DD. */
export function uniqueSortedDates(dates: readonly string[]): string[] {
  return Array.from(new Set(dates.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/**
 * Longest run of consecutive calendar days in `dates`.
 */
export function bestDayStreak(dates: readonly string[]): number {
  const sorted = uniqueSortedDates(dates);
  if (sorted.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (dayDiff(sorted[i], sorted[i - 1]) === 1) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}

/**
 * Current streak ending on `asOfDate` (default: today local YYYY-MM-DD).
 * Counts consecutive days with a hit walking backward from asOfDate.
 * If asOfDate itself has no hit, returns 0 (streak broken today).
 */
export function currentDayStreak(
  dates: readonly string[],
  asOfDate?: string,
): number {
  const set = new Set(uniqueSortedDates(dates));
  if (set.size === 0) return 0;

  const asOf =
    asOfDate ??
    new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local tz

  if (!set.has(asOf)) return 0;

  let streak = 0;
  let cursor = asOf;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * ISO-like week key: YYYY-Www using Thursday-based ISO week (UTC).
 */
export function isoWeekKey(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  // ISO week: Thursday determines the year.
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function prevIsoWeekKey(key: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(key);
  if (!match) return key;
  const year = Number(match[1]);
  const week = Number(match[2]);
  // Approximate: go back 7 days from Thursday of that week.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const day = jan4.getUTCDay() || 7;
  const thursday = new Date(jan4);
  thursday.setUTCDate(jan4.getUTCDate() - day + 4 + (week - 1) * 7);
  thursday.setUTCDate(thursday.getUTCDate() - 7);
  return isoWeekKey(thursday.toISOString().slice(0, 10));
}

/**
 * Current consecutive weeks (ending on the week of `asOfDate`) that have ≥1 hit.
 */
export function currentWeekStreak(
  dates: readonly string[],
  asOfDate?: string,
): number {
  const weeks = new Set(uniqueSortedDates(dates).map(isoWeekKey));
  if (weeks.size === 0) return 0;

  const asOf =
    asOfDate ?? new Date().toLocaleDateString("en-CA");
  let cursor = isoWeekKey(asOf);
  if (!weeks.has(cursor)) return 0;

  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor = prevIsoWeekKey(cursor);
  }
  return streak;
}

/**
 * Longest run of consecutive ISO weeks with ≥1 hit.
 */
export function bestWeekStreak(dates: readonly string[]): number {
  const weeks = Array.from(
    new Set(uniqueSortedDates(dates).map(isoWeekKey)),
  ).sort();
  if (weeks.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < weeks.length; i++) {
    if (prevIsoWeekKey(weeks[i]) === weeks[i - 1]) {
      run += 1;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }
  return best;
}
