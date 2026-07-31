import type { AnalyticsSnapshot } from "@/features/analytics";
import type { InsightCandidate, InsightRule } from "../types";
import { formatEsNumber, formatEsPercent } from "../format";

/**
 * Truly relevant streak: only a new record of meaningful length.
 * Short “active streak” restatements are noise.
 */
function recordGoalStreak(snapshot: AnalyticsSnapshot): InsightCandidate | null {
  const { currentGoalStreak, bestGoalStreak, goal } = snapshot.steps;
  if (currentGoalStreak < 7) return null;
  if (currentGoalStreak < bestGoalStreak) return null;

  return {
    key: "streak-record",
    type: "achievement",
    title: `Nueva racha récord: ${currentGoalStreak} días con el objetivo de pasos`,
    description:
      "No es un día suelto: has batido tu mejor racha de adherencia diaria.",
    evidence: `Objetivo ${formatEsNumber(goal, { digits: 0 })} pasos/día · récord anterior ${bestGoalStreak} días.`,
    category: "steps",
    priority: currentGoalStreak >= 10 ? "high" : "medium",
    confidence: "high",
    date: snapshot.asOfDate,
  };
}

/**
 * Activity −20 % vs last month → behavioral warning (invite return to movement).
 */
function activityDropWarning(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const avg7 = snapshot.steps.average("7d");
  const avg30 = snapshot.steps.average("30d");
  if (avg7 == null || avg30 == null || avg30 <= 0) return null;
  if (snapshot.steps.dayCount < 10) return null;

  const ratio = (avg7 - avg30) / avg30;
  if (ratio > -0.2) return null;

  return {
    key: "activity-drop",
    type: "warning",
    title: `Tu actividad ha caído un ${formatEsPercent(Math.abs(ratio))} frente a tu mes`,
    description:
      "Mucho menos movimiento que de costumbre. Vale la pena volver a caminar esta semana.",
    evidence: `Media 7 días ${formatEsNumber(avg7, { digits: 0 })} vs media 30 días ${formatEsNumber(avg30, { digits: 0 })}.`,
    category: "steps",
    priority: "high",
    confidence: Math.abs(ratio) >= 0.3 ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Hoy: una caminata de 15–20 min entre tareas. Abre Traza y anótala.",
  };
}

export const stepsInsightsRule: InsightRule = {
  id: "steps.summary",
  category: "steps",
  evaluate(snapshot) {
    return [
      activityDropWarning(snapshot),
      recordGoalStreak(snapshot),
    ].filter((c): c is InsightCandidate => c != null);
  },
};
