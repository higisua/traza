/**
 * Weight domain types.
 * Calendar-ready: every entry has entryDate (YYYY-MM-DD) + entryTime (HH:mm)
 * plus occurredAt (ISO) for day/timeline queries later.
 */

export type WeightEntry = {
  id: string;
  /** Calendar day key: YYYY-MM-DD */
  entryDate: string;
  /** Local time: HH:mm */
  entryTime: string;
  /** ISO datetime derived from entryDate + entryTime (local). */
  occurredAt: string;
  weightKg: number;
  bodyFatPct: number | null;
  createdAt: string;
  updatedAt: string;
};

export type WeightEntryInput = {
  entryDate: string;
  entryTime: string;
  weightKg: number;
  bodyFatPct?: number | null;
};

export type WeightTrendDirection = "up" | "down" | "flat" | null;

export type WeightSummary = {
  latest: WeightEntry | null;
  previous: WeightEntry | null;
  weightTrend: WeightTrendDirection;
  bodyFatTrend: WeightTrendDirection;
  count: number;
};

export type WeightChartPoint = {
  id: string;
  occurredAt: string;
  entryDate: string;
  entryTime: string;
  weightKg: number;
  label: string;
};

export type WeightFieldErrors = {
  entryDate?: string;
  entryTime?: string;
  weightKg?: string;
  bodyFatPct?: string;
};

export type WeightValidationResult =
  | { ok: true; value: WeightEntryInput }
  | { ok: false; errors: WeightFieldErrors };
