import type {
  AnalyticsPeriod,
  AnalyticsSnapshot,
  DeltaResult,
} from "@/features/analytics";
import { periodDays } from "@/features/analytics";
import { addCalendarDays } from "@/features/analytics/core";
import { isMeaningfulAbsolute } from "@/features/insights/format";
import { formatWeightKg, formatBodyFatPct } from "@/features/weight";
import { formatCm } from "@/features/measurements";
import { formatSleepDurationShort } from "@/features/sleep";
import { formatStepsCount } from "@/features/steps";
import { formatVolumeKg } from "@/features/workout/WorkoutFormat";
import { WorkoutRepository } from "@/features/workout/WorkoutRepository";
import type { ProgressChartSeries } from "./buildProgressChartSeries";
import { isDateInPeriod, periodStartDate } from "./periodWindow";
import {
  formatDeltaLine,
  toneFromDelta,
  toneFromTrend,
  type Polarity,
  type VariationTone,
} from "./progressFormat";
import { formatEsNumber, formatEsPercent } from "@/features/insights/format";

export type HeroMetric = {
  id: string;
  label: string;
  /** Prefer change / count; absolute is secondary. */
  primary: string;
  secondary?: string;
  tone: VariationTone;
};

/**
 * Pure editorial cover for Progress — answers “what mattered most this period?”
 * Built from Analytics only; no React, no hardcoded module order.
 */
export type HeroSummary = {
  primary: HeroMetric | null;
  /** At most two supporting signals — hierarchy, not a KPI strip. */
  supporting: HeroMetric[];
};

type HeroBucket = "body" | "train" | "sleep" | "steps" | "bp" | "prs";

type HeroCandidate = HeroMetric & {
  score: number;
  bucket: HeroBucket;
};

export type RecentPrView = {
  exerciseName: string;
  detail: string;
  date: string;
};

/** How many supporting slots under the primary cover datum. */
export const HERO_SUPPORTING_LIMIT = 2;

function deltaTone(
  delta: DeltaResult | null,
  polarity: Polarity,
  epsilon: number,
): VariationTone {
  return toneFromDelta(delta?.absolute, polarity, epsilon);
}

/** Weight/fat: direction only — no good/bad colour (Analytics polarity is blunt). */
function neutralChangeTone(
  delta: DeltaResult | null,
  epsilon: number,
): VariationTone {
  if (!delta || !Number.isFinite(delta.absolute)) return "neutral";
  if (Math.abs(delta.absolute) < epsilon) return "flat";
  return "neutral";
}

/**
 * Period lens — widened so 7d vs 30d vs all pick visibly different primaries
 * when several domains have data.
 */
function periodAffinity(period: AnalyticsPeriod, bucket: HeroBucket): number {
  if (period === "7d") {
    return { train: 42, sleep: 36, steps: 32, bp: 24, body: 6, prs: 14 }[
      bucket
    ];
  }
  if (period === "90d") {
    return { body: 44, train: 28, sleep: 16, steps: 14, bp: 8, prs: 20 }[
      bucket
    ];
  }
  if (period === "all") {
    return { body: 38, train: 34, prs: 40, sleep: 10, steps: 8, bp: 6 }[
      bucket
    ];
  }
  // 30d — body composition carries the story
  return { body: 40, train: 30, sleep: 20, steps: 18, bp: 10, prs: 16 }[
    bucket
  ];
}

/** Reward clear movement over static absolutes. */
function changePremium(hasMeaningfulChange: boolean): number {
  return hasMeaningfulChange ? 28 : 0;
}

/**
 * Log-scaled magnitude so a −2.4 kg move outranks −0.3 kg without
 * drowning period affinity.
 */
function magnitudeBonus(
  absolute: number | null | undefined,
  epsilon: number,
  scale = 10,
): number {
  if (absolute == null || !Number.isFinite(absolute)) return 0;
  const units = Math.abs(absolute) / Math.max(epsilon, 1e-6);
  if (units < 1) return 0;
  return Math.min(36, Math.log2(1 + units) * scale);
}

export function workoutsInPeriod(
  period: AnalyticsPeriod,
  asOfDate: string,
): number {
  return WorkoutRepository.getSessions().filter(
    (s) =>
      (s.status === "completed" || s.status === "partial") &&
      isDateInPeriod(s.sessionDate, period, asOfDate),
  ).length;
}

/** Sessions in the immediately preceding window of the same length. */
export function workoutsInPriorPeriod(
  period: AnalyticsPeriod,
  asOfDate: string,
): number | null {
  const days = periodDays(period);
  if (days == null) return null;
  const currentStart = periodStartDate(period, asOfDate);
  if (currentStart == null) return null;
  const priorStart = addCalendarDays(asOfDate, -(days * 2));
  return WorkoutRepository.getSessions().filter((s) => {
    if (s.status !== "completed" && s.status !== "partial") return false;
    return s.sessionDate >= priorStart && s.sessionDate < currentStart;
  }).length;
}

function pickHeroSummary(candidates: HeroCandidate[]): HeroSummary {
  if (candidates.length === 0) {
    return { primary: null, supporting: [] };
  }

  const ranked = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });

  const [top, ...rest] = ranked;
  const primaryMetric: HeroMetric = {
    id: top!.id,
    label: top!.label,
    primary: top!.primary,
    secondary: top!.secondary,
    tone: top!.tone,
  };

  // Prefer supporting from different domains so the cover isn't three weight rows
  const supporting: HeroMetric[] = [];
  const usedBuckets = new Set<HeroBucket>([top!.bucket]);

  for (const c of rest) {
    if (supporting.length >= HERO_SUPPORTING_LIMIT) break;
    if (usedBuckets.has(c.bucket) && rest.length > HERO_SUPPORTING_LIMIT) {
      continue;
    }
    usedBuckets.add(c.bucket);
    supporting.push({
      id: c.id,
      label: c.label,
      primary: c.primary,
      secondary: c.secondary,
      tone: c.tone,
    });
  }

  // If diversity filter left holes, fill from remaining score order
  if (supporting.length < HERO_SUPPORTING_LIMIT) {
    for (const c of rest) {
      if (supporting.length >= HERO_SUPPORTING_LIMIT) break;
      if (supporting.some((s) => s.id === c.id)) continue;
      supporting.push({
        id: c.id,
        label: c.label,
        primary: c.primary,
        secondary: c.secondary,
        tone: c.tone,
      });
    }
  }

  return { primary: primaryMetric, supporting };
}

/**
 * Build the Progress hero cover from an Analytics snapshot.
 * Picks the single most important period signal — any domain — then up to two supports.
 */
export function buildHeroSummary(input: {
  snapshot: AnalyticsSnapshot;
  period: AnalyticsPeriod;
  workoutCount: number;
  priorWorkoutCount: number | null;
  charts: ProgressChartSeries;
  recentPrs: RecentPrView[];
}): HeroSummary {
  const {
    snapshot,
    period,
    workoutCount,
    priorWorkoutCount,
    charts,
    recentPrs,
  } = input;
  const candidates: HeroCandidate[] = [];

  const weightDelta = snapshot.weight.delta(period);
  const fatDelta = snapshot.bodyFat.delta(period);
  const waistDelta = snapshot.measurements.waist?.delta(period) ?? null;
  const sleepAvg = snapshot.sleep.duration.average(period);
  const sleepDelta = snapshot.sleep.duration.delta(period);
  const stepsAvg = snapshot.steps.average(period);
  const stepsDelta = snapshot.steps.delta(period);
  const sysAvg = snapshot.bloodPressure.systolic.average(period);
  const diaAvg = snapshot.bloodPressure.diastolic.average(period);
  const pulseAvg = snapshot.bloodPressure.pulse.average(period);
  const sysTrend = snapshot.bloodPressure.systolic.trend(period);
  const sysDelta = snapshot.bloodPressure.systolic.delta(period);

  // —— Body changes (prefer deltas) ——
  if (weightDelta && isMeaningfulAbsolute(weightDelta.absolute, 0.15)) {
    candidates.push({
      id: "weight-delta",
      label: "Peso",
      primary: formatDeltaLine(weightDelta, "kg", 1, 0.05) ?? "—",
      secondary:
        snapshot.weight.last != null
          ? `Último ${formatWeightKg(snapshot.weight.last)} kg`
          : undefined,
      tone: neutralChangeTone(weightDelta, 0.05),
      bucket: "body",
      score:
        18 +
        periodAffinity(period, "body") +
        changePremium(true) +
        magnitudeBonus(weightDelta.absolute, 0.3, 11),
    });
  } else if (snapshot.weight.last != null && snapshot.weight.count > 0) {
    candidates.push({
      id: "weight-last",
      label: "Peso",
      primary: `${formatWeightKg(snapshot.weight.last)} kg`,
      tone: "neutral",
      bucket: "body",
      score: 8 + periodAffinity(period, "body") * 0.35,
    });
  }

  if (fatDelta && isMeaningfulAbsolute(fatDelta.absolute, 0.2)) {
    candidates.push({
      id: "fat-delta",
      label: "Grasa",
      primary: formatDeltaLine(fatDelta, "%", 1, 0.1) ?? "—",
      secondary:
        snapshot.bodyFat.last != null
          ? `Último ${formatBodyFatPct(snapshot.bodyFat.last)} %`
          : undefined,
      tone: neutralChangeTone(fatDelta, 0.1),
      bucket: "body",
      score:
        14 +
        periodAffinity(period, "body") +
        changePremium(true) +
        magnitudeBonus(fatDelta.absolute, 0.35, 10) -
        4,
    });
  }

  if (waistDelta && isMeaningfulAbsolute(waistDelta.absolute, 0.4)) {
    candidates.push({
      id: "waist-delta",
      label: "Cintura",
      primary: formatDeltaLine(waistDelta, "cm", 1, 0.2) ?? "—",
      secondary:
        snapshot.measurements.waist?.last != null
          ? `Último ${formatCm(snapshot.measurements.waist.last)} cm`
          : undefined,
      tone: deltaTone(waistDelta, "lower_is_better", 0.2),
      bucket: "body",
      score:
        22 +
        periodAffinity(period, "body") +
        changePremium(true) +
        magnitudeBonus(waistDelta.absolute, 0.5, 12) +
        6,
    });
  }

  // —— Training (prefer evolution vs prior window) ——
  if (workoutCount > 0) {
    const hasCompare =
      priorWorkoutCount != null && priorWorkoutCount > 0;
    const diff =
      hasCompare && priorWorkoutCount != null
        ? workoutCount - priorWorkoutCount
        : null;
    const volumeLine =
      snapshot.workout.weeklyVolumeKg > 0
        ? `${formatVolumeKg(snapshot.workout.weeklyVolumeKg)} kg sem.`
        : undefined;

    let primary: string;
    let secondary: string | undefined;
    let trainScoreBoost = 0;

    if (diff != null && Math.abs(diff) >= 1 && priorWorkoutCount != null) {
      if (diff > 0) {
        primary =
          diff === 1
            ? "1 sesión más"
            : `${formatEsNumber(diff, { digits: 0 })} sesiones más`;
        secondary = `${formatEsNumber(workoutCount, { digits: 0 })} en el periodo`;
      } else {
        primary =
          diff === -1
            ? "1 sesión menos"
            : `${formatEsNumber(Math.abs(diff), { digits: 0 })} sesiones menos`;
        secondary = `${formatEsNumber(workoutCount, { digits: 0 })} en el periodo`;
      }
      trainScoreBoost = changePremium(true) + magnitudeBonus(diff, 1, 9);
    } else {
      primary =
        workoutCount === 1
          ? "1 sesión"
          : `${formatEsNumber(workoutCount, { digits: 0 })} sesiones`;
      secondary =
        period === "7d"
          ? volumeLine
          : snapshot.workout.workoutsPerWeek != null
            ? `${formatEsNumber(snapshot.workout.workoutsPerWeek, { digits: 1 })} / sem`
            : volumeLine;
    }

    candidates.push({
      id: "workouts",
      label: period === "all" ? "Total entrenos" : "Entrenamientos",
      primary,
      secondary,
      tone:
        diff != null && diff > 0
          ? "up"
          : diff != null && diff < 0
            ? "down"
            : "neutral",
      bucket: "train",
      score:
        16 +
        periodAffinity(period, "train") +
        trainScoreBoost +
        (period === "7d" ? 8 : 0),
    });
  } else if (
    snapshot.workout.weeklyVolumeKg > 0 &&
    (period === "7d" || period === "30d")
  ) {
    candidates.push({
      id: "weekly-volume",
      label: "Volumen semanal",
      primary: `${formatVolumeKg(snapshot.workout.weeklyVolumeKg)} kg`,
      tone: "neutral",
      bucket: "train",
      score: 12 + periodAffinity(period, "train"),
    });
  }

  // —— Sleep ——
  if (sleepAvg != null && snapshot.sleep.count >= 1) {
    const hasChange =
      sleepDelta != null && isMeaningfulAbsolute(sleepDelta.absolute, 8);
    candidates.push({
      id: "sleep",
      label: hasChange ? "Cambio de sueño" : "Sueño medio",
      primary: hasChange
        ? (formatDeltaLine(sleepDelta, "min", 0, 5) ??
          formatSleepDurationShort(Math.round(sleepAvg)))
        : formatSleepDurationShort(Math.round(sleepAvg)),
      secondary: hasChange
        ? `Media ${formatSleepDurationShort(Math.round(sleepAvg))}`
        : snapshot.sleep.count < 2
          ? "Última noche"
          : undefined,
      tone: hasChange
        ? deltaTone(sleepDelta, "higher_is_better", 5)
        : "neutral",
      bucket: "sleep",
      score:
        12 +
        periodAffinity(period, "sleep") +
        changePremium(!!hasChange) +
        magnitudeBonus(sleepDelta?.absolute, 15, 9) +
        (period === "7d" && hasChange ? 10 : 0) +
        (snapshot.sleep.count >= 2 ? 4 : 0),
    });
  }

  // —— Steps ——
  if (stepsAvg != null && snapshot.steps.dayCount >= 1) {
    const goalRatio =
      period === "30d" || period === "90d" || period === "all"
        ? snapshot.steps.goalMetRatio
        : charts.steps.length > 0
          ? charts.steps.filter((p) => p.goalReached).length /
            charts.steps.length
          : snapshot.steps.goalMetRatio;
    const hasChange =
      stepsDelta != null && isMeaningfulAbsolute(stepsDelta.absolute, 400);

    if (goalRatio != null && (period === "30d" || period === "90d")) {
      candidates.push({
        id: "steps-goal",
        label: "Objetivo pasos",
        primary: formatEsPercent(goalRatio, { digits: 0 }),
        secondary: `Media ${formatStepsCount(Math.round(stepsAvg))}`,
        tone: "neutral",
        bucket: "steps",
        score:
          14 +
          periodAffinity(period, "steps") +
          (goalRatio >= 0.7 ? 8 : goalRatio <= 0.35 ? 6 : 0),
      });
    } else if (snapshot.steps.dayCount >= 2 || period === "7d") {
      candidates.push({
        id: "steps",
        label: hasChange ? "Cambio de pasos" : "Pasos medios",
        primary: hasChange
          ? (formatDeltaLine(stepsDelta, "pasos", 0, 200) ??
            formatStepsCount(Math.round(stepsAvg)))
          : formatStepsCount(Math.round(stepsAvg)),
        secondary: hasChange
          ? `Media ${formatStepsCount(Math.round(stepsAvg))}`
          : undefined,
        tone: hasChange
          ? deltaTone(stepsDelta, "higher_is_better", 200)
          : "neutral",
        bucket: "steps",
        score:
          12 +
          periodAffinity(period, "steps") +
          changePremium(!!hasChange) +
          magnitudeBonus(stepsDelta?.absolute, 500, 8) +
          (period === "7d" && hasChange ? 8 : 0),
      });
    }
  }

  // —— BP ——
  if (
    sysAvg != null &&
    diaAvg != null &&
    snapshot.bloodPressure.count >= (period === "7d" ? 1 : 2)
  ) {
    const hasChange =
      sysDelta != null && isMeaningfulAbsolute(sysDelta.absolute, 3);
    const stable =
      !hasChange &&
      (sysTrend == null || sysTrend.direction === "flat");
    candidates.push({
      id: "bp",
      label: "Tensión",
      primary: stable
        ? "Estable"
        : hasChange
          ? (formatDeltaLine(sysDelta, "mmHg", 0, 1) ??
            `${formatEsNumber(Math.round(sysAvg), { digits: 0 })}/${formatEsNumber(Math.round(diaAvg), { digits: 0 })}`)
          : `${formatEsNumber(Math.round(sysAvg), { digits: 0 })}/${formatEsNumber(Math.round(diaAvg), { digits: 0 })}`,
      secondary: `${formatEsNumber(Math.round(sysAvg), { digits: 0 })}/${formatEsNumber(Math.round(diaAvg), { digits: 0 })}${
        pulseAvg != null
          ? ` · pulso ${formatEsNumber(Math.round(pulseAvg), { digits: 0 })}`
          : ""
      }`,
      tone: toneFromTrend(sysTrend?.direction, "lower_is_better"),
      bucket: "bp",
      score:
        10 +
        periodAffinity(period, "bp") +
        changePremium(!!hasChange) +
        magnitudeBonus(sysDelta?.absolute, 4, 8) +
        (period === "7d" ? 6 : 0),
    });
  }

  // —— PRs / milestones (strong on all-time; still eligible in windows) ——
  if (recentPrs.length > 0) {
    const pr = recentPrs[0]!;
    const allTimeBoost = period === "all" ? 18 : period === "90d" ? 8 : 0;
    candidates.push({
      id: "pr-milestone",
      label: "Récord reciente",
      primary: pr.exerciseName,
      secondary: pr.detail,
      tone: "up",
      bucket: "prs",
      score:
        14 +
        periodAffinity(period, "prs") +
        changePremium(true) +
        allTimeBoost,
    });
  }

  if (period === "all" && snapshot.workout.totalVolumeKg > 0) {
    candidates.push({
      id: "volume-total",
      label: "Volumen acumulado",
      primary: `${formatVolumeKg(snapshot.workout.totalVolumeKg)} kg`,
      tone: "neutral",
      bucket: "train",
      score: 10 + periodAffinity(period, "train"),
    });
  }

  return pickHeroSummary(candidates);
}
