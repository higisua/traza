import type { AnalyticsSnapshot, ScalarSeriesMetrics } from "@/features/analytics";
import type { InsightCandidate, InsightRule } from "../types";
import { daysBetween, formatCm, isMeaningfulAbsolute } from "../format";

type MeasurementKey = "waist" | "arm" | "leg";

function metricBag(
  snapshot: AnalyticsSnapshot,
  key: MeasurementKey,
): ScalarSeriesMetrics | null {
  return snapshot.measurements[key];
}

/**
 * Bare “waist down / arm up” chart echoes are killed.
 * Only large opposing or anomalous swings survive as trends —
 * and even then with a high bar so correlations stay preferred.
 */
function significantAnomalousSwing(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  for (const [key, label, minAbs] of [
    ["waist", "cintura", 3],
    ["arm", "brazo", 1.5],
    ["leg", "pierna", 1.5],
  ] as const) {
    const series = metricBag(snapshot, key);
    if (!series || series.count < 4) continue;
    const delta = series.delta("30d");
    const trend = series.trend("30d");
    if (!delta || !isMeaningfulAbsolute(delta.absolute, minAbs)) continue;
    if (!trend || trend.direction === "flat") continue;

    const direction = delta.absolute < 0 ? "bajado" : "subido";
    const isPositiveWaist = key === "waist" && delta.absolute < 0;
    const isLimbGrowth =
      (key === "arm" || key === "leg") && delta.absolute > 0;

    return {
      key: `${key}-swing`,
      type: isPositiveWaist || isLimbGrowth ? "trend" : "warning",
      title: `Cambio marcado en ${label} este mes`,
      description: isPositiveWaist
        ? "Un movimiento de cintura así en 30 días suele contar más composición que un kilo suelto."
        : isLimbGrowth
          ? "Aumento claro de perímetro con entrenamiento — algo que el peso solo no cuenta."
          : `Tu ${label} ha ${direction} de forma notable; contrástalo con peso y entreno.`,
      evidence: `${formatCm(delta.from)} → ${formatCm(delta.to)} (${formatCm(delta.absolute, true)}) en 30 días.`,
      category: "measurements",
      priority: "medium",
      confidence: Math.abs(delta.absolute) >= minAbs * 1.5 ? "high" : "medium",
      date: snapshot.asOfDate,
    };
  }

  return null;
}

/** Behavioral: weeks without body measurements → invite return. */
function measurementLogGap(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  if (snapshot.measurements.count < 2) return null;

  const dates = [
    snapshot.measurements.waist?.lastDate,
    snapshot.measurements.arm?.lastDate,
    snapshot.measurements.leg?.lastDate,
  ].filter((d): d is string => d != null);

  if (dates.length === 0) return null;
  const last = dates.sort().at(-1)!;
  const gap = daysBetween(last, snapshot.asOfDate);
  if (gap < 14) return null;

  const weeks = Math.floor(gap / 7);

  return {
    key: "meas-gap",
    type: "warning",
    title:
      weeks >= 3
        ? `Llevas ${weeks} semanas sin medir cintura u otros perímetros`
        : "Hace más de dos semanas que no te mides",
    description:
      "Sin medidas recientes, peso y espejo cuentan a medias. Una pasada rápida te devuelve el mapa.",
    evidence: `Última medición: ${last} (${gap} días atrás).`,
    category: "measurements",
    priority: weeks >= 3 ? "high" : "medium",
    confidence: "high",
    date: snapshot.asOfDate,
    action: "Abre Traza y anota cintura (y brazo/pierna si puedes) esta semana.",
  };
}

export const measurementInsightsRule: InsightRule = {
  id: "measurements.summary",
  category: "measurements",
  evaluate(snapshot) {
    return [
      measurementLogGap(snapshot),
      significantAnomalousSwing(snapshot),
    ].filter((c): c is InsightCandidate => c != null);
  },
};
