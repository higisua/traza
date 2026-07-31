/**
 * Body measurements — full session of physical transformation tracking.
 * Future photos: optional URIs reserved on the entry, unused in Phase 1.5 UI.
 */

export type MeasurementPhotos = {
  frontUri?: string | null;
  sideUri?: string | null;
  backUri?: string | null;
};

export type MeasurementEntry = {
  id: string;
  entryDate: string;
  entryTime: string;
  occurredAt: string;
  waistCm: number;
  armCm: number;
  legCm: number;
  /** Reserved for future progress photos — do not surface in Phase 1.5. */
  photos: MeasurementPhotos | null;
  createdAt: string;
  updatedAt: string;
};

export type MeasurementEntryInput = {
  entryDate: string;
  entryTime: string;
  waistCm: number;
  armCm: number;
  legCm: number;
};

export type MeasurementMetricDelta = {
  current: number;
  previous: number | null;
  delta: number | null;
};

export type MeasurementSummary = {
  latest: MeasurementEntry | null;
  previous: MeasurementEntry | null;
  waist: MeasurementMetricDelta | null;
  arm: MeasurementMetricDelta | null;
  leg: MeasurementMetricDelta | null;
  count: number;
};

export type MeasurementChartPoint = {
  id: string;
  occurredAt: string;
  entryDate: string;
  entryTime: string;
  waistCm: number;
  armCm: number;
  legCm: number;
  label: string;
};

export type MeasurementFieldErrors = {
  entryDate?: string;
  entryTime?: string;
  waistCm?: string;
  armCm?: string;
  legCm?: string;
};

export type MeasurementValidationResult =
  | { ok: true; value: MeasurementEntryInput }
  | { ok: false; errors: MeasurementFieldErrors };
