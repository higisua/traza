/**
 * Steps domain — daily activity / movement personality.
 */

export type StepsEntry = {
  id: string;
  entryDate: string;
  entryTime: string;
  occurredAt: string;
  steps: number;
  createdAt: string;
  updatedAt: string;
};

export type StepsEntryInput = {
  entryDate: string;
  entryTime: string;
  steps: number;
};

export type StepsDayProgress = {
  entryDate: string;
  totalSteps: number;
  goal: number;
  remaining: number;
  progress: number;
  goalReached: boolean;
};

export type StepsSummary = {
  latest: StepsEntry | null;
  today: StepsDayProgress;
  count: number;
};

export type StepsChartPoint = {
  entryDate: string;
  totalSteps: number;
  goal: number;
  label: string;
  goalReached: boolean;
};

export type StepsFieldErrors = {
  entryDate?: string;
  entryTime?: string;
  steps?: string;
};

export type StepsValidationResult =
  | { ok: true; value: StepsEntryInput }
  | { ok: false; errors: StepsFieldErrors };
