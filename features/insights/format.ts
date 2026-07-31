/** Spanish (Spain) formatting helpers for insight copy. */

export function formatEsNumber(
  value: number,
  options?: { digits?: number; signed?: boolean },
): string {
  const digits = options?.digits ?? 1;
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
  if (options?.signed) {
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `−${formatted}`;
  }
  return value < 0 ? `−${formatted}` : formatted;
}

/** Percent with space before % (es-ES style), e.g. "40 %". */
export function formatEsPercent(
  ratioOrPercent: number,
  options?: { alreadyPercent?: boolean; digits?: number; signed?: boolean },
): string {
  const pct = options?.alreadyPercent
    ? ratioOrPercent
    : ratioOrPercent * 100;
  return `${formatEsNumber(pct, {
    digits: options?.digits ?? 0,
    signed: options?.signed,
  })} %`;
}

export function formatKg(kg: number, signed = false): string {
  return `${formatEsNumber(kg, { digits: 1, signed })} kg`;
}

export function formatCm(cm: number, signed = false): string {
  return `${formatEsNumber(cm, { digits: 1, signed })} cm`;
}

export function formatMinutesAsHours(minutes: number): string {
  const hours = minutes / 60;
  return `${formatEsNumber(hours, { digits: 1 })} h`;
}

/** True when absolute change clears a noise floor. */
export function isMeaningfulAbsolute(
  value: number | null | undefined,
  minAbs: number,
): value is number {
  return value != null && Number.isFinite(value) && Math.abs(value) >= minAbs;
}

/** True when percent change clears a noise floor (percent is 0–100 scale from DeltaResult). */
export function isMeaningfulPercent(
  percent: number | null | undefined,
  minAbsPercent: number,
): percent is number {
  return (
    percent != null &&
    Number.isFinite(percent) &&
    Math.abs(percent) >= minAbsPercent
  );
}

export function daysBetween(fromYmd: string, toYmd: string): number {
  const from = Date.parse(`${fromYmd}T12:00:00`);
  const to = Date.parse(`${toYmd}T12:00:00`);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return Number.POSITIVE_INFINITY;
  return Math.round((to - from) / 86_400_000);
}

export function isRecentDate(
  date: string | null | undefined,
  asOfDate: string,
  withinDays: number,
): boolean {
  if (!date) return false;
  const d = daysBetween(date, asOfDate);
  return d >= 0 && d <= withinDays;
}
