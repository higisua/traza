/**
 * Motion tokens — silent, elegant, barely perceptible.
 */

export const motionDuration = {
  fast: 0.16,
  normal: 0.24,
  slow: 0.36,
  page: 0.3,
  chart: 0.65,
} as const;

export const motionEase = {
  standard: [0.22, 1, 0.36, 1] as const,
  spring: [0.16, 1, 0.3, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
};

export const motionScale = {
  press: 0.988,
} as const;

export const motionOffset = {
  cardLift: -1,
  pageSlide: 4,
  sheet: 16,
} as const;
