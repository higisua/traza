import type {
  AnalyticsPeriod,
  AnalyticsSnapshot,
  DeltaResult,
  TrendResult,
} from "@/features/analytics";
import type { InsightsResult, Insight, InsightType } from "@/features/insights";
import { isMeaningfulAbsolute } from "@/features/insights/format";
import { formatWeightKg, formatBodyFatPct } from "@/features/weight";
import { formatCm } from "@/features/measurements";
import { formatSleepDurationShort, formatSleepScore } from "@/features/sleep";
import { formatStepsCount } from "@/features/steps";
import { formatVolumeKg } from "@/features/workout/WorkoutFormat";
import { classifyBloodPressure } from "@/features/blood-pressure";
import type { ProgressChartSeries } from "./buildProgressChartSeries";
import { isDateInPeriod } from "./periodWindow";
import {
  formatDeltaLine,
  formatGoalDaysRatio,
  PERIOD_LABEL,
  toneFromDelta,
  toneFromTrend,
  type Polarity,
  type VariationTone,
} from "./progressFormat";
import { formatEsNumber } from "@/features/insights/format";
import {
  buildHeroSummary,
  workoutsInPeriod,
  workoutsInPriorPeriod,
  type HeroMetric,
  type HeroSummary,
  type RecentPrView,
} from "./buildHeroSummary";

/** Progress surfaces top engine-ranked insights (no category hardcoding). */
export const PROGRESS_FEATURED_INSIGHTS = 3;

export type { HeroMetric, HeroSummary, RecentPrView };

export type BlockMetric = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  tone: VariationTone;
  href?: string;
};

export type CompositionBlockView = {
  metrics: BlockMetric[];
  sparse: boolean;
  sparseMessage?: string;
  /** Whole-block deep link (weight preferred when present). */
  href: string;
  chartKind: "weight" | "measurements" | null;
};

export type ActivityBlockView = {
  metrics: BlockMetric[];
  bestPr: RecentPrView | null;
  sparse: boolean;
  sparseMessage?: string;
  href: string;
  chartKind: "volume" | "steps" | null;
};

export type RecoveryBlockView = {
  metrics: BlockMetric[];
  sparse: boolean;
  sparseMessage?: string;
  href: string;
  chartKind: "sleep" | "bloodPressure" | null;
  disclaimer: string | null;
};

export type ProgressViewModel = {
  period: AnalyticsPeriod;
  periodLabel: string;
  asOfDate: string;
  hasAnyData: boolean;
  hero: HeroSummary;
  featuredInsights: Insight[];
  moreInsights: Insight[];
  composition: CompositionBlockView | null;
  activity: ActivityBlockView | null;
  recovery: RecoveryBlockView | null;
  insightTypeLabel: (type: InsightType) => string;
};

const INSIGHT_TYPE_LABEL: Record<InsightType, string> = {
  achievement: "Logro",
  trend: "Tendencia",
  correlation: "Correlación",
  warning: "Atención",
  recommendation: "Sugerencia",
};

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

function meaningfulDeltaLine(
  delta: DeltaResult | null,
  unit: string,
  digits: number,
  epsilon: number,
): string | undefined {
  if (!delta || !isMeaningfulAbsolute(delta.absolute, epsilon)) return undefined;
  return formatDeltaLine(delta, unit, digits, epsilon) ?? undefined;
}

function buildComposition(
  snapshot: AnalyticsSnapshot,
  period: AnalyticsPeriod,
  charts: ProgressChartSeries,
): CompositionBlockView | null {
  const hasWeight = snapshot.weight.count > 0;
  const waist = snapshot.measurements.waist;
  const arm = snapshot.measurements.arm;
  const leg = snapshot.measurements.leg;
  const hasMeas =
    (waist && waist.count > 0) ||
    (arm && arm.count > 0) ||
    (leg && leg.count > 0);

  if (!hasWeight && !hasMeas) return null;

  const weightDelta = snapshot.weight.delta(period);
  const fatDelta = snapshot.bodyFat.delta(period);
  const waistDelta = waist?.delta(period) ?? null;
  const armDelta = arm?.delta(period) ?? null;
  const legDelta = leg?.delta(period) ?? null;

  const metrics: BlockMetric[] = [];

  const waistChange =
    waistDelta != null && isMeaningfulAbsolute(waistDelta.absolute, 0.4);
  const waistLast = waist?.last ?? null;

  // Waist leads when present — visual priority over equal KPI strip
  if (waistLast != null) {
    metrics.push({
      id: "waist",
      label: "Cintura",
      value: waistChange
        ? (meaningfulDeltaLine(waistDelta, "cm", 1, 0.2) ??
          `${formatCm(waistLast)} cm`)
        : `${formatCm(waistLast)} cm`,
      detail: waistChange
        ? `Último ${formatCm(waistLast)} cm`
        : meaningfulDeltaLine(waistDelta, "cm", 1, 0.2),
      tone: deltaTone(waistDelta, "lower_is_better", 0.2),
      href: "/measurements",
    });
  }

  if (hasWeight && snapshot.weight.last != null) {
    metrics.push({
      id: "weight",
      label: "Peso",
      value: `${formatWeightKg(snapshot.weight.last)} kg`,
      detail: meaningfulDeltaLine(weightDelta, "kg", 1, 0.05),
      tone: neutralChangeTone(weightDelta, 0.05),
      href: "/weight",
    });
  }

  if (snapshot.bodyFat.last != null) {
    metrics.push({
      id: "fat",
      label: "Grasa",
      value: `${formatBodyFatPct(snapshot.bodyFat.last)} %`,
      detail: meaningfulDeltaLine(fatDelta, "%", 1, 0.1),
      tone: neutralChangeTone(fatDelta, 0.1),
      href: "/weight",
    });
  }

  // Arm / leg only as tertiary — keep block scannable (max 4 total)
  if (metrics.length < 4 && arm && arm.last != null) {
    metrics.push({
      id: "arm",
      label: "Brazo",
      value: `${formatCm(arm.last)} cm`,
      detail: meaningfulDeltaLine(armDelta, "cm", 1, 0.2),
      tone: "neutral",
      href: "/measurements",
    });
  }

  if (metrics.length < 4 && leg && leg.last != null) {
    metrics.push({
      id: "leg",
      label: "Pierna",
      value: `${formatCm(leg.last)} cm`,
      detail: meaningfulDeltaLine(legDelta, "cm", 1, 0.2),
      tone: "neutral",
      href: "/measurements",
    });
  }

  const weightSparse = charts.weight.length < 2;
  const measSparse = charts.measurements.length < 2;

  let chartKind: CompositionBlockView["chartKind"] = null;
  if (waistChange && !measSparse) chartKind = "measurements";
  else if (!weightSparse) chartKind = "weight";
  else if (!measSparse) chartKind = "measurements";

  const sparse = chartKind == null;
  const href = hasWeight ? "/weight" : "/measurements";

  return {
    metrics,
    sparse,
    sparseMessage: sparse
      ? "Con más registros verás la evolución conjunta."
      : undefined,
    href,
    chartKind,
  };
}

function buildActivity(
  snapshot: AnalyticsSnapshot,
  period: AnalyticsPeriod,
  charts: ProgressChartSeries,
  workoutCount: number,
  priorWorkoutCount: number | null,
  recentPrs: RecentPrView[],
): ActivityBlockView | null {
  const hasTrain = snapshot.workout.totalWorkouts > 0 && workoutCount > 0;
  const hasSteps = snapshot.steps.dayCount > 0;

  if (!hasTrain && !hasSteps) return null;

  const metrics: BlockMetric[] = [];
  const stepsAvg = snapshot.steps.average(period);
  const stepsDelta = snapshot.steps.delta(period);

  if (hasTrain) {
    const diff =
      priorWorkoutCount != null && priorWorkoutCount > 0
        ? workoutCount - priorWorkoutCount
        : null;
    let detail: string | undefined;
    if (diff != null && Math.abs(diff) >= 1) {
      detail =
        diff > 0
          ? diff === 1
            ? "1 más que antes"
            : `${formatEsNumber(diff, { digits: 0 })} más que antes`
          : diff === -1
            ? "1 menos que antes"
            : `${formatEsNumber(Math.abs(diff), { digits: 0 })} menos que antes`;
    } else if (snapshot.workout.workoutsPerWeek != null) {
      detail = `${formatEsNumber(snapshot.workout.workoutsPerWeek, { digits: 1 })} / sem`;
    }

    metrics.push({
      id: "sessions",
      label: "Sesiones",
      value:
        workoutCount === 1
          ? "1"
          : formatEsNumber(workoutCount, { digits: 0 }),
      detail,
      tone:
        diff != null && diff > 0
          ? "up"
          : diff != null && diff < 0
            ? "down"
            : "neutral",
      href: "/train",
    });

    if (snapshot.workout.weeklyVolumeKg > 0) {
      metrics.push({
        id: "volume",
        label: "Volumen sem.",
        value: `${formatVolumeKg(snapshot.workout.weeklyVolumeKg)} kg`,
        tone: "neutral",
        href: "/train",
      });
    } else if (period === "all" && snapshot.workout.totalVolumeKg > 0) {
      metrics.push({
        id: "volume-total",
        label: "Volumen",
        value: `${formatVolumeKg(snapshot.workout.totalVolumeKg)} kg`,
        tone: "neutral",
        href: "/train",
      });
    }
  }

  if (hasSteps && stepsAvg != null) {
    const goalDays =
      charts.steps.length > 0
        ? charts.steps.filter((p) => p.goalReached).length / charts.steps.length
        : snapshot.steps.goalMetRatio;
    metrics.push({
      id: "steps",
      label: "Pasos",
      value: formatStepsCount(Math.round(stepsAvg)),
      detail: [
        formatDeltaLine(stepsDelta, "pasos", 0, 200),
        formatGoalDaysRatio(goalDays),
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
      tone: deltaTone(stepsDelta, "higher_is_better", 200),
      href: "/steps",
    });
  }

  const trimmed = metrics.slice(0, 3);

  let chartKind: ActivityBlockView["chartKind"] = null;
  if (charts.weeklyVolume.length >= 1) chartKind = "volume";
  else if (charts.steps.length >= 2) chartKind = "steps";

  const sparse = chartKind == null && recentPrs.length === 0;
  const href = hasTrain ? "/train" : "/steps";

  return {
    metrics: trimmed,
    bestPr: recentPrs[0] ?? null,
    sparse,
    sparseMessage: sparse
      ? "El resumen de actividad aparecerá con más sesiones o pasos."
      : undefined,
    href,
    chartKind,
  };
}

function bpStory(
  sysAvg: number,
  diaAvg: number,
  sysDelta: DeltaResult | null,
  sysTrend: TrendResult | null,
): { value: string; detail: string; tone: VariationTone } {
  const reading = `${formatEsNumber(Math.round(sysAvg), { digits: 0 })}/${formatEsNumber(Math.round(diaAvg), { digits: 0 })}`;
  const category = classifyBloodPressure(Math.round(sysAvg), Math.round(diaAvg));
  const hasChange =
    sysDelta != null && isMeaningfulAbsolute(sysDelta.absolute, 3);
  const direction = sysTrend?.direction;

  let value: string;
  if (!hasChange && (direction == null || direction === "flat")) {
    value = "Tensión estable";
  } else if (direction === "down" || (hasChange && sysDelta!.absolute < 0)) {
    value = "Tensión a la baja";
  } else if (direction === "up" || (hasChange && sysDelta!.absolute > 0)) {
    value = "Tensión al alza";
  } else {
    value = category.label === "Óptima" || category.label === "Normal"
      ? `Tensión ${category.label.toLowerCase()}`
      : category.label;
  }

  const deltaBit = formatDeltaLine(sysDelta, "mmHg", 0, 1);
  const detail = deltaBit ? `${reading} · ${deltaBit}` : reading;

  const tone =
    sysTrend != null
      ? toneFromTrend(sysTrend.direction, "lower_is_better")
      : deltaTone(sysDelta, "lower_is_better", 1);

  return { value, detail, tone };
}

function buildRecovery(
  snapshot: AnalyticsSnapshot,
  period: AnalyticsPeriod,
  charts: ProgressChartSeries,
): RecoveryBlockView | null {
  const sleepAvg = snapshot.sleep.duration.average(period);
  const sleepDelta = snapshot.sleep.duration.delta(period);
  const sleepScoreAvg = snapshot.sleep.score.average(period);
  const sysAvg = snapshot.bloodPressure.systolic.average(period);
  const diaAvg = snapshot.bloodPressure.diastolic.average(period);
  const pulseAvg = snapshot.bloodPressure.pulse.average(period);
  const sysDelta = snapshot.bloodPressure.systolic.delta(period);
  const sysTrend = snapshot.bloodPressure.systolic.trend(period);

  const hasSleep = snapshot.sleep.count > 0 && sleepAvg != null;
  const hasBp =
    snapshot.bloodPressure.count > 0 && sysAvg != null && diaAvg != null;

  if (!hasSleep && !hasBp) return null;

  const metrics: BlockMetric[] = [];

  if (hasSleep) {
    metrics.push({
      id: "sleep",
      label: "Sueño",
      value: formatSleepDurationShort(Math.round(sleepAvg)),
      detail: [
        formatDeltaLine(sleepDelta, "min", 0, 5),
        sleepScoreAvg != null
          ? `Punt. ${formatSleepScore(Math.round(sleepScoreAvg))}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
      tone: deltaTone(sleepDelta, "higher_is_better", 5),
      href: "/sleep",
    });
  }

  if (hasBp) {
    const story = bpStory(sysAvg, diaAvg, sysDelta, sysTrend);
    metrics.push({
      id: "bp",
      label: "Tensión",
      value: story.value,
      detail: story.detail,
      tone: story.tone,
      href: "/blood-pressure",
    });

    if (pulseAvg != null && metrics.length < 3) {
      metrics.push({
        id: "pulse",
        label: "Pulso",
        value: formatEsNumber(Math.round(pulseAvg), { digits: 0 }),
        tone: "neutral",
        href: "/blood-pressure",
      });
    }
  }

  let chartKind: RecoveryBlockView["chartKind"] = null;
  if (charts.sleep.length >= 2) chartKind = "sleep";
  else if (charts.bloodPressure.length >= 2) chartKind = "bloodPressure";

  const sparse = chartKind == null;
  const href = hasSleep ? "/sleep" : "/blood-pressure";

  return {
    metrics,
    sparse,
    sparseMessage: sparse
      ? "Con más noches o lecturas verás la tendencia."
      : undefined,
    href,
    chartKind,
    disclaimer: hasBp ? "Informativo — no es un diagnóstico" : null,
  };
}

/**
 * Presentation view-model — formats Analytics + Insights for Progress UI.
 * Does not invent scores or recompute domain math beyond display helpers.
 */
export function buildProgressViewModel(input: {
  snapshot: AnalyticsSnapshot;
  insights: InsightsResult;
  period: AnalyticsPeriod;
  charts: ProgressChartSeries;
}): ProgressViewModel {
  const { snapshot, insights, period, charts } = input;
  const asOfDate = snapshot.asOfDate;
  const workoutCount = workoutsInPeriod(period, asOfDate);
  const priorWorkoutCount = workoutsInPriorPeriod(period, asOfDate);

  const hasAnyData =
    snapshot.weight.count > 0 ||
    snapshot.measurements.count > 0 ||
    snapshot.sleep.count > 0 ||
    snapshot.steps.dayCount > 0 ||
    snapshot.bloodPressure.count > 0 ||
    snapshot.workout.totalWorkouts > 0;

  const recentPrs: RecentPrView[] = [];
  const flatPrs = snapshot.workout.personalRecords.flatMap((ex) =>
    ex.records.map((r) => ({
      exerciseName: ex.nameEs,
      kind: r.kind,
      load: r.load,
      repetitions: r.repetitions,
      volumeKg: r.volumeKg,
      date: r.sessionDate,
    })),
  );
  flatPrs.sort((a, b) => b.date.localeCompare(a.date));
  for (const pr of flatPrs) {
    if (!isDateInPeriod(pr.date, period, asOfDate)) continue;
    let detail = "";
    if (pr.kind === "max_load" && pr.load != null) {
      detail = `${formatEsNumber(pr.load, { digits: 1 })} kg`;
    } else if (pr.kind === "max_reps" && pr.repetitions != null) {
      detail = `${pr.repetitions} reps`;
    } else {
      detail = formatVolumeKg(pr.volumeKg);
    }
    recentPrs.push({
      exerciseName: pr.exerciseName,
      detail,
      date: pr.date,
    });
    if (recentPrs.length >= 2) break;
  }

  const hero = buildHeroSummary({
    snapshot,
    period,
    workoutCount,
    priorWorkoutCount,
    charts,
    recentPrs,
  });

  return {
    period,
    periodLabel: PERIOD_LABEL[period],
    asOfDate,
    hasAnyData,
    hero,
    featuredInsights: insights.insights.slice(0, PROGRESS_FEATURED_INSIGHTS),
    moreInsights: insights.insights.slice(PROGRESS_FEATURED_INSIGHTS),
    composition: buildComposition(snapshot, period, charts),
    activity: buildActivity(
      snapshot,
      period,
      charts,
      workoutCount,
      priorWorkoutCount,
      recentPrs,
    ),
    recovery: buildRecovery(snapshot, period, charts),
    insightTypeLabel: (type) => INSIGHT_TYPE_LABEL[type],
  };
}
