/**
 * Sleep domain types — quality of rest personality.
 */

export type SleepEntry = {
  id: string;
  /** Calendar day the sleep night belongs to (wake day typically). */
  entryDate: string;
  /** Time the record was logged. */
  entryTime: string;
  occurredAt: string;
  durationMinutes: number;
  score: number | null;
  bedTime: string | null;
  wakeTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SleepEntryInput = {
  entryDate: string;
  entryTime: string;
  durationMinutes: number;
  score?: number | null;
  bedTime?: string | null;
  wakeTime?: string | null;
};

export type SleepQualityId =
  | "excellent"
  | "good"
  | "fair"
  | "poor"
  | "short"
  | "adequate"
  | "long";

export type SleepQuality = {
  id: SleepQualityId;
  label: string;
  tone: "excellent" | "good" | "fair" | "poor" | "neutral";
};

export type SleepSummary = {
  latest: SleepEntry | null;
  previous: SleepEntry | null;
  quality: SleepQuality | null;
  count: number;
};

export type SleepChartPoint = {
  id: string;
  occurredAt: string;
  entryDate: string;
  entryTime: string;
  durationMinutes: number;
  score: number | null;
  label: string;
};

export type SleepFieldErrors = {
  entryDate?: string;
  entryTime?: string;
  durationHours?: string;
  durationMinutes?: string;
  score?: string;
  bedTime?: string;
  wakeTime?: string;
};

export type SleepValidationResult =
  | { ok: true; value: SleepEntryInput }
  | { ok: false; errors: SleepFieldErrors };
