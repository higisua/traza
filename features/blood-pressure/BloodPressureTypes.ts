/**
 * Blood pressure domain types.
 * Calendar-ready: entryDate + entryTime + occurredAt.
 */

export type BloodPressureEntry = {
  id: string;
  entryDate: string;
  entryTime: string;
  occurredAt: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  createdAt: string;
  updatedAt: string;
};

export type BloodPressureEntryInput = {
  entryDate: string;
  entryTime: string;
  systolic: number;
  diastolic: number;
  pulse: number;
};

/** ESC/ESH 2018 office BP categories (informational, not diagnostic). */
export type BloodPressureCategoryId =
  | "optimal"
  | "normal"
  | "high_normal"
  | "grade1"
  | "grade2"
  | "grade3";

export type BloodPressureCategory = {
  id: BloodPressureCategoryId;
  label: string;
  /** Visual tone for badges */
  tone: "optimal" | "normal" | "caution" | "elevated" | "high" | "critical";
};

export type BloodPressureSummary = {
  latest: BloodPressureEntry | null;
  previous: BloodPressureEntry | null;
  category: BloodPressureCategory | null;
  count: number;
};

export type BloodPressureChartPoint = {
  id: string;
  occurredAt: string;
  entryDate: string;
  entryTime: string;
  systolic: number;
  diastolic: number;
  label: string;
};

export type BloodPressureFieldErrors = {
  entryDate?: string;
  entryTime?: string;
  systolic?: string;
  diastolic?: string;
  pulse?: string;
};

export type BloodPressureValidationResult =
  | { ok: true; value: BloodPressureEntryInput }
  | { ok: false; errors: BloodPressureFieldErrors };
