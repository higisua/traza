import type { SleepQuality } from "./SleepTypes";

export function formatSleepDuration(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins.toString().padStart(2, "0")} min`;
}

/** Compact for Home tiles: "7 h 21" */
export function formatSleepDurationShort(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins.toString().padStart(2, "0")}`;
}

export function formatSleepScore(score: number): string {
  return `${Math.round(score)} puntos`;
}

/**
 * Soft, encouraging quality language.
 * Only: Excelente · Bueno · A mejorar
 */
export function classifySleepQuality(
  durationMinutes: number,
  score: number | null,
): SleepQuality {
  if (score !== null) {
    if (score >= 90) {
      return { id: "excellent", label: "Excelente", tone: "excellent" };
    }
    if (score >= 75) {
      return { id: "good", label: "Bueno", tone: "good" };
    }
    return { id: "fair", label: "A mejorar", tone: "fair" };
  }

  if (durationMinutes < 6 * 60) {
    return { id: "short", label: "A mejorar", tone: "fair" };
  }
  if (durationMinutes > 9 * 60) {
    return { id: "long", label: "Bueno", tone: "good" };
  }
  return { id: "adequate", label: "Bueno", tone: "good" };
}

/** Minutes between bed and wake crossing midnight if needed. */
export function durationFromBedWake(
  bedTime: string,
  wakeTime: string,
): number | null {
  if (!/^\d{2}:\d{2}$/.test(bedTime) || !/^\d{2}:\d{2}$/.test(wakeTime)) {
    return null;
  }
  const [bh, bm] = bedTime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  let start = bh * 60 + bm;
  let end = wh * 60 + wm;
  if (end <= start) end += 24 * 60;
  return end - start;
}
