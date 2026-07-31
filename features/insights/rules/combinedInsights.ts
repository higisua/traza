import type { AnalyticsSnapshot } from "@/features/analytics";
import type { InsightCandidate, InsightRule } from "../types";
import {
  formatCm,
  formatEsNumber,
  formatEsPercent,
  formatKg,
  formatMinutesAsHours,
  isMeaningfulAbsolute,
} from "../format";

/**
 * Combined / cross-domain conclusions — highest product value.
 * Honest language (“coinciden”), never false causality claims.
 */

function formatEsNumberSafe(n: number): string {
  return n.toLocaleString("es-ES", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
}

function trainingIsActive(snapshot: AnalyticsSnapshot): boolean {
  const { weeklyVolumeKg, totalWorkouts, workoutsPerWeek } = snapshot.workout;
  return (
    snapshot.streaks.trainingWeeks >= 2 ||
    (workoutsPerWeek != null && workoutsPerWeek >= 2) ||
    (totalWorkouts >= 4 && weeklyVolumeKg > 0)
  );
}

/** Weight↓ while training volume stays active. */
function weightDownVolumeUp(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const weightDelta = snapshot.weight.delta("30d");
  if (
    !weightDelta ||
    !isMeaningfulAbsolute(weightDelta.absolute, 0.5) ||
    weightDelta.absolute >= 0
  ) {
    return null;
  }

  if (!trainingIsActive(snapshot)) return null;

  const { weeklyVolumeKg, workoutsPerWeek } = snapshot.workout;
  const pct =
    weightDelta.percent != null
      ? formatEsPercent(Math.abs(weightDelta.percent), { alreadyPercent: true })
      : null;

  return {
    key: "weight-down-volume-up",
    type: "correlation",
    title: pct
      ? `Bajas peso (${pct}) y mantienes el volumen de entrenamiento`
      : "Bajas peso y mantienes el volumen de entrenamiento",
    description:
      "Perder peso coincidiendo con fuerza activa suele preservar mejor el músculo que un déficit quieto.",
    evidence: `Peso 30d ${formatKg(weightDelta.from)} → ${formatKg(weightDelta.to)}; volumen 7d ${formatEsNumberSafe(weeklyVolumeKg)} kg; ~${formatEsNumberSafe(workoutsPerWeek ?? snapshot.streaks.trainingWeeks)} sesiones/sem.`,
    category: "general",
    priority: "high",
    confidence: Math.abs(weightDelta.absolute) >= 1.5 ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Sigue priorizando proteína y las series de fuerza clave.",
  };
}

/** Weight↓ + waist↓ — recomposition signal across two charts. */
function weightAndWaistDown(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const waist = snapshot.measurements.waist;
  const waistDelta = waist?.delta("30d") ?? null;
  const weightDelta = snapshot.weight.delta("30d");

  if (
    !waist ||
    !waistDelta ||
    !weightDelta ||
    waist.count < 3 ||
    snapshot.weight.count < 3
  ) {
    return null;
  }

  if (!isMeaningfulAbsolute(waistDelta.absolute, 1) || waistDelta.absolute >= 0) {
    return null;
  }
  if (
    !isMeaningfulAbsolute(weightDelta.absolute, 0.5) ||
    weightDelta.absolute >= 0
  ) {
    return null;
  }

  return {
    key: "weight-waist-both-down",
    type: "correlation",
    title: "Peso y cintura bajan a la vez este mes",
    description:
      "Dos mediciones distintas se mueven juntas a la baja — más fiable que mirar solo la báscula.",
    evidence: `Peso ${formatKg(weightDelta.from)} → ${formatKg(weightDelta.to)}; cintura ${formatCm(waistDelta.from)} → ${formatCm(waistDelta.to)}.`,
    category: "general",
    priority: "high",
    confidence:
      Math.abs(waistDelta.absolute) >= 2 && Math.abs(weightDelta.absolute) >= 1
        ? "high"
        : "medium",
    date: snapshot.asOfDate,
  };
}

/** Waist↓ with weight nearly flat. */
function waistDownWeightStable(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const waist = snapshot.measurements.waist;
  const waistDelta = waist?.delta("30d") ?? null;
  const weightDelta = snapshot.weight.delta("30d");

  if (
    !waist ||
    !waistDelta ||
    !weightDelta ||
    waist.count < 3 ||
    snapshot.weight.count < 3
  ) {
    return null;
  }

  if (!isMeaningfulAbsolute(waistDelta.absolute, 1) || waistDelta.absolute >= 0) {
    return null;
  }

  // Weight stable: |Δ| < 0.8 kg over 30d — mutually exclusive with both-down.
  if (Math.abs(weightDelta.absolute) >= 0.8) return null;

  return {
    key: "waist-down-weight-stable",
    type: "correlation",
    title: "La cintura baja aunque el peso apenas se mueve",
    description:
      "Señal clásica de recomposición: la báscula no lo cuenta todo.",
    evidence: `Cintura ${formatCm(waistDelta.from)} → ${formatCm(waistDelta.to)}; peso casi plano (${formatKg(weightDelta.absolute, true)}).`,
    category: "general",
    priority: "high",
    confidence: Math.abs(waistDelta.absolute) >= 2 ? "high" : "medium",
    date: snapshot.asOfDate,
  };
}

/** Better sleep coinciding with regular training. */
function sleepBetterWhenTraining(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const perWeek = snapshot.workout.workoutsPerWeek;
  const trainingOk =
    (perWeek != null && perWeek >= 2.8) || snapshot.streaks.trainingWeeks >= 3;
  if (!trainingOk || snapshot.workout.totalWorkouts < 6) return null;

  const avg7 = snapshot.sleep.duration.average("7d");
  const avg30 = snapshot.sleep.duration.average("30d");
  if (avg7 == null || avg30 == null || avg30 <= 0) return null;
  if (snapshot.sleep.count < 5) return null;

  const ratio = (avg7 - avg30) / avg30;
  if (ratio < 0.06) return null;

  return {
    key: "sleep-better-training",
    type: "correlation",
    title: "Duermes mejor en semanas que coinciden con entrenamiento regular",
    description:
      "Mejor sueño y ritmo de entrenamiento aparecen juntos en tus datos.",
    evidence: `Con ~${formatEsNumberSafe(perWeek ?? 3)} sesiones/semana, media 7d ${formatMinutesAsHours(avg7)} vs media 30d ${formatMinutesAsHours(avg30)}.`,
    category: "general",
    priority: "high",
    confidence: ratio >= 0.12 ? "high" : "medium",
    date: snapshot.asOfDate,
  };
}

/** Training active + body fat↓. */
function trainingWithFatDown(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  if (!trainingIsActive(snapshot)) return null;
  if (snapshot.bodyFat.count < 4) return null;

  const fatDelta = snapshot.bodyFat.delta("30d");
  const fatTrend = snapshot.bodyFat.trend("30d");
  if (
    !fatDelta ||
    !fatTrend ||
    fatDelta.absolute >= 0 ||
    !isMeaningfulAbsolute(fatDelta.absolute, 0.4)
  ) {
    return null;
  }
  if (fatTrend.direction === "up") return null;

  const { workoutsPerWeek, weeklyVolumeKg } = snapshot.workout;

  return {
    key: "training-fat-down",
    type: "correlation",
    title: "Entrenamiento activo y, a la vez, baja la grasa corporal",
    description:
      "Fuerza y composición se mueven juntas a tu favor este mes.",
    evidence: `Grasa ${formatEsNumber(fatDelta.from)} % → ${formatEsNumber(fatDelta.to)} %; ~${formatEsNumberSafe(workoutsPerWeek ?? snapshot.streaks.trainingWeeks)} sesiones/sem; volumen 7d ${formatEsNumberSafe(weeklyVolumeKg)} kg.`,
    category: "general",
    priority: "high",
    confidence: Math.abs(fatDelta.absolute) >= 0.8 ? "high" : "medium",
    date: snapshot.asOfDate,
  };
}

/** Sleep↑ coinciding with BP↓. */
function sleepUpWithBpDown(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const avg7 = snapshot.sleep.duration.average("7d");
  const avg30 = snapshot.sleep.duration.average("30d");
  if (avg7 == null || avg30 == null || avg30 <= 0) return null;
  if (snapshot.sleep.count < 5) return null;

  const sleepRatio = (avg7 - avg30) / avg30;
  if (sleepRatio < 0.06) return null;

  if (snapshot.bloodPressure.count < 4) return null;
  const sys = snapshot.bloodPressure.systolic.delta("30d");
  const dia = snapshot.bloodPressure.diastolic.delta("30d");
  const sysDown =
    sys != null && isMeaningfulAbsolute(sys.absolute, 3) && sys.absolute < 0;
  const diaDown =
    dia != null && isMeaningfulAbsolute(dia.absolute, 2) && dia.absolute < 0;
  if (!sysDown && !diaDown) return null;

  const bpParts: string[] = [];
  if (sysDown && sys) {
    bpParts.push(`sistólica ${sys.from.toFixed(0)} → ${sys.to.toFixed(0)}`);
  }
  if (diaDown && dia) {
    bpParts.push(`diastólica ${dia.from.toFixed(0)} → ${dia.to.toFixed(0)}`);
  }

  return {
    key: "sleep-up-bp-down",
    type: "correlation",
    title: "Mejor sueño y, a la vez, lecturas de presión más bajas",
    description:
      "Descanso y presión coinciden en la dirección deseada en tus registros.",
    evidence: `Sueño media 7d ${formatMinutesAsHours(avg7)} vs 30d ${formatMinutesAsHours(avg30)}; presión: ${bpParts.join("; ")}.`,
    category: "general",
    priority: "high",
    confidence: sysDown && diaDown && sleepRatio >= 0.1 ? "high" : "medium",
    date: snapshot.asOfDate,
  };
}

/** Sleep↑ coinciding with higher training volume. */
function sleepUpWithVolumeUp(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const avg7 = snapshot.sleep.duration.average("7d");
  const avg30 = snapshot.sleep.duration.average("30d");
  if (avg7 == null || avg30 == null || avg30 <= 0) return null;
  if (snapshot.sleep.count < 5) return null;

  const sleepRatio = (avg7 - avg30) / avg30;
  if (sleepRatio < 0.06) return null;

  const { weeklyVolumeKg, totalVolumeKg, totalWorkouts, workoutsPerWeek } =
    snapshot.workout;
  if (totalWorkouts < 4 || weeklyVolumeKg <= 0 || workoutsPerWeek == null) {
    return null;
  }

  const weeksSpanned =
    workoutsPerWeek > 0 ? totalWorkouts / workoutsPerWeek : 0;
  const lifetimeWeeklyAvg =
    weeksSpanned > 0 ? totalVolumeKg / weeksSpanned : 0;
  if (lifetimeWeeklyAvg <= 0) return null;
  if (weeklyVolumeKg < lifetimeWeeklyAvg * 1.2) return null;

  return {
    key: "sleep-up-volume-up",
    type: "correlation",
    title: "Mejor sueño y más volumen de entrenamiento coinciden esta semana",
    description:
      "Descansas más y empujas más kilos a la vez — patrón que suele acompañar buenas semanas.",
    evidence: `Sueño media 7d ${formatMinutesAsHours(avg7)} vs 30d ${formatMinutesAsHours(avg30)}; volumen 7d ${formatEsNumberSafe(weeklyVolumeKg)} kg vs media ≈ ${formatEsNumberSafe(lifetimeWeeklyAvg)} kg.`,
    category: "general",
    priority: "high",
    confidence:
      sleepRatio >= 0.1 && weeklyVolumeKg >= lifetimeWeeklyAvg * 1.35
        ? "high"
        : "medium",
    date: snapshot.asOfDate,
  };
}

/**
 * Short recent sleep coinciding with softer training volume.
 */
function performanceSoftWhenShortSleep(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const avg7 = snapshot.sleep.duration.average("7d");
  if (avg7 == null || avg7 >= 6 * 60) return null;
  if (snapshot.sleep.count < 4) return null;
  if (snapshot.workout.totalWorkouts < 4) return null;

  const { weeklyVolumeKg, totalVolumeKg, workoutsPerWeek } = snapshot.workout;
  const weeksSpanned =
    workoutsPerWeek != null && workoutsPerWeek > 0
      ? snapshot.workout.totalWorkouts / workoutsPerWeek
      : 0;
  const lifetimeWeeklyAvg =
    weeksSpanned > 0 ? totalVolumeKg / weeksSpanned : 0;

  const volumeSoft =
    lifetimeWeeklyAvg > 0 && weeklyVolumeKg < lifetimeWeeklyAvg * 0.85;

  if (!volumeSoft) return null;

  return {
    key: "soft-perf-short-sleep",
    type: "correlation",
    title: "Rendimiento más flojo en un periodo con sueño por debajo de 6 h",
    description:
      "Noches cortas y menos volumen de lo habitual aparecen juntos — pista para priorizar descanso.",
    evidence: `Sueño media 7d ${formatMinutesAsHours(avg7)}; volumen 7d ${formatEsNumberSafe(weeklyVolumeKg)} kg vs media semanal ≈ ${formatEsNumberSafe(lifetimeWeeklyAvg)} kg.`,
    category: "general",
    priority: "high",
    confidence: avg7 < 5.5 * 60 ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Prioriza 1–2 noches más largas antes de forzar otra semana dura.",
  };
}

export const combinedInsightsRule: InsightRule = {
  id: "combined.cross_domain",
  category: "general",
  evaluate(snapshot) {
    return [
      weightDownVolumeUp(snapshot),
      weightAndWaistDown(snapshot),
      waistDownWeightStable(snapshot),
      sleepBetterWhenTraining(snapshot),
      trainingWithFatDown(snapshot),
      sleepUpWithBpDown(snapshot),
      sleepUpWithVolumeUp(snapshot),
      performanceSoftWhenShortSleep(snapshot),
    ].filter((c): c is InsightCandidate => c != null);
  },
};
