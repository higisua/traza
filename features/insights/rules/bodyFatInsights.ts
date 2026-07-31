import type { AnalyticsSnapshot } from "@/features/analytics";
import type { InsightCandidate, InsightRule } from "../types";
import {
  formatEsNumber,
  formatEsPercent,
  isMeaningfulAbsolute,
} from "../format";

/**
 * Bare “new body-fat min” killed — chart-visible.
 * Keep only sustained 30d composition trends.
 */
function sustainedBodyFatChange(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const delta = snapshot.bodyFat.delta("30d");
  const trend = snapshot.bodyFat.trend("30d");
  if (!delta || !trend || snapshot.bodyFat.count < 4) return null;
  if (!isMeaningfulAbsolute(delta.absolute, 0.4)) return null;

  if (delta.absolute < 0 && trend.direction === "down") {
    const pct =
      delta.percent != null
        ? formatEsPercent(Math.abs(delta.percent), { alreadyPercent: true })
        : null;
    return {
      key: "improving",
      type: "trend",
      title: pct
        ? `La grasa corporal baja de forma sostenida (−${pct} en 30 días)`
        : "La grasa corporal baja de forma sostenida",
      description:
        "No es un único registro bajo: la tendencia del mes apunta a un cambio real.",
      evidence: `${formatEsNumber(delta.from)} % → ${formatEsNumber(delta.to)} % en 30 días.`,
      category: "body_fat",
      priority: "high",
      confidence: Math.abs(delta.absolute) >= 0.8 ? "high" : "medium",
      date: snapshot.asOfDate,
    };
  }

  if (delta.absolute > 0 && trend.direction === "up") {
    return {
      key: "worsening",
      type: "warning",
      title: "La grasa corporal está subiendo de forma sostenida",
      description:
        "La tendencia alcista del mes merece revisar sueño, estrés y adherencia.",
      evidence: `${formatEsNumber(delta.from)} % → ${formatEsNumber(delta.to)} % en 30 días.`,
      category: "body_fat",
      priority: "medium",
      confidence: Math.abs(delta.absolute) >= 0.8 ? "high" : "medium",
      date: snapshot.asOfDate,
      action: "Comprueba si coincide con menos pasos o menos entrenos.",
    };
  }

  return null;
}

export const bodyFatInsightsRule: InsightRule = {
  id: "body_fat.summary",
  category: "body_fat",
  evaluate(snapshot) {
    return [sustainedBodyFatChange(snapshot)].filter(
      (c): c is InsightCandidate => c != null,
    );
  },
};
