/**
 * Daily steps goal — default now, personalization later.
 * Do not wire settings UI yet; keep a single seam for future config.
 */

export const DEFAULT_DAILY_STEPS_GOAL = 10_000;

export function getDailyStepsGoal(): number {
  return DEFAULT_DAILY_STEPS_GOAL;
}
