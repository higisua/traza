import type { AnalyticsSnapshot } from "@/features/analytics";
import type { InsightCandidate, InsightRule } from "../types";
import {
  daysBetween,
  formatEsPercent,
  formatKg,
  isMeaningfulAbsolute,
} from "../format";

function lostThisMonth(snapshot: AnalyticsSnapshot): InsightCandidate | null {
  const delta = snapshot.weight.delta("30d");
  const trend = snapshot.weight.trend("30d");
  if (!delta || !isMeaningfulAbsolute(delta.absolute, 0.8)) return null;
  if (delta.absolute >= 0) return null;
  if (trend && trend.direction === "up") return null;

  const pctLabel =
    delta.percent != null
      ? formatEsPercent(Math.abs(delta.percent), { alreadyPercent: true })
      : null;
  const strong = Math.abs(delta.absolute) >= 2;

  return {
    key: "lost-month",
    type: "trend",
    title: pctLabel
      ? `Pérdida de peso sostenida este mes (−${pctLabel})`
      : "Pérdida de peso sostenida este mes",
    description:
      "El cambio a 30 días apunta a una tendencia real, no a un día bueno en la báscula.",
    evidence: `${formatKg(delta.from)} → ${formatKg(delta.to)} en 30 días (${formatKg(delta.absolute, true)}).`,
    category: "weight",
    priority: strong ? "high" : "medium",
    confidence: strong ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Comprueba si sueño y entrenamiento acompañan el déficit.",
  };
}

function gainedThisMonth(snapshot: AnalyticsSnapshot): InsightCandidate | null {
  const delta = snapshot.weight.delta("30d");
  const trend = snapshot.weight.trend("30d");
  if (!delta || !isMeaningfulAbsolute(delta.absolute, 0.8)) return null;
  if (delta.absolute <= 0) return null;
  if (trend && trend.direction === "down") return null;

  const pctLabel =
    delta.percent != null
      ? formatEsPercent(Math.abs(delta.percent), { alreadyPercent: true })
      : null;
  const strong = Math.abs(delta.absolute) >= 2;

  return {
    key: "gained-month",
    type: "trend",
    title: pctLabel
      ? `Aumento de peso sostenido este mes (+${pctLabel})`
      : "Aumento de peso sostenido este mes",
    description:
      "El peso sube claro en el mes — contrástalo con cintura, grasa y volumen antes de cambiar de plan.",
    evidence: `${formatKg(delta.from)} → ${formatKg(delta.to)} en 30 días (${formatKg(delta.absolute, true)}).`,
    category: "weight",
    priority: strong ? "high" : "medium",
    confidence: strong ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Mira cintura y grasa antes de tocar el plan.",
  };
}

/** Behavioral: several days without a weight log → invite return. */
function weightLogGap(snapshot: AnalyticsSnapshot): InsightCandidate | null {
  const last = snapshot.weight.lastDate;
  if (!last || snapshot.weight.count < 3) return null;

  const gap = daysBetween(last, snapshot.asOfDate);
  if (gap < 5) return null;

  return {
    key: "log-gap",
    type: "warning",
    title:
      gap >= 10
        ? `Llevas ${gap} días sin registrar el peso`
        : `Llevas ${gap} días sin pasarte por la báscula`,
    description:
      "Sin registros recientes se pierde el hilo. Un peso al día (o cada 2) basta para volver a ver tendencia.",
    evidence: `Último registro: ${last} (${gap} días atrás).`,
    category: "weight",
    priority: gap >= 10 ? "high" : "medium",
    confidence: "high",
    date: snapshot.asOfDate,
    action: "Abre Traza y anota el peso de hoy — tarda 10 segundos.",
  };
}

/**
 * Bare “new historical min/max” and “current weight” are killed — chart echoes.
 * Sustained month trends + logging-gap warning remain.
 */
export const weightInsightsRule: InsightRule = {
  id: "weight.summary",
  category: "weight",
  evaluate(snapshot) {
    return [
      weightLogGap(snapshot),
      lostThisMonth(snapshot),
      gainedThisMonth(snapshot),
    ].filter((c): c is InsightCandidate => c != null);
  },
};
