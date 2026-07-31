import {
  CALENDAR_MODULES,
  type CalendarModuleKey,
  type DayPresence,
} from "./CalendarTypes";

export type PresenceSourceDates = {
  training: readonly string[];
  weight: readonly string[];
  bloodPressure: readonly string[];
  sleep: readonly string[];
  steps: readonly string[];
  measurements: readonly string[];
};

function toDateSet(dates: readonly string[]): Set<string> {
  return new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)));
}

/**
 * Pure aggregator: maps YYYY-MM-DD → modules with at least one entry.
 * Does not copy records — only date keys.
 */
export function buildPresenceByDate(
  sources: PresenceSourceDates,
): Map<string, DayPresence> {
  const byModule: Record<CalendarModuleKey, Set<string>> = {
    training: toDateSet(sources.training),
    weight: toDateSet(sources.weight),
    bloodPressure: toDateSet(sources.bloodPressure),
    sleep: toDateSet(sources.sleep),
    steps: toDateSet(sources.steps),
    measurements: toDateSet(sources.measurements),
  };

  const allDates = new Set<string>();
  for (const key of CALENDAR_MODULES) {
    for (const date of byModule[key]) {
      allDates.add(date);
    }
  }

  const map = new Map<string, DayPresence>();
  for (const date of allDates) {
    const modules = CALENDAR_MODULES.filter((key) => byModule[key].has(date));
    map.set(date, { date, modules });
  }
  return map;
}

export function presenceForDate(
  map: Map<string, DayPresence>,
  date: string,
): DayPresence {
  return map.get(date) ?? { date, modules: [] };
}

export function monthHasAnyPresence(
  map: Map<string, DayPresence>,
  monthPrefix: string,
): boolean {
  for (const date of map.keys()) {
    if (date.startsWith(monthPrefix)) return true;
  }
  return false;
}
