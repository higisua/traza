import type { AnalyticsSnapshot } from "@/features/analytics";
import type { InsightCandidate, InsightRule } from "../types";
import {
  formatMinutesAsHours,
  formatEsPercent,
  isMeaningfulAbsolute,
} from "../format";

const SHORT_NIGHT_AVG_MIN = 6.5 * 60;

/**
 * Snapshot has no true week-over-week window. We compare the last 7 days'
 * average duration to the 30-day average as an honest “recent vs usual” proxy.
 */
function sleepVsUsual(snapshot: AnalyticsSnapshot): InsightCandidate | null {
  const avg7 = snapshot.sleep.duration.average("7d");
  const avg30 = snapshot.sleep.duration.average("30d");
  if (avg7 == null || avg30 == null || avg30 <= 0) return null;
  if (snapshot.sleep.count < 5) return null;

  const ratio = (avg7 - avg30) / avg30;
  if (Math.abs(ratio) < 0.12) return null;

  if (ratio > 0) {
    return {
      key: "better-vs-usual",
      type: "trend",
      title: `Esta semana duermes un ${formatEsPercent(ratio)} más que tu media`,
      description:
        "El sueño reciente mejora claro frente a tu patrón del mes.",
      evidence: `Media 7 días ${formatMinutesAsHours(avg7)} vs media 30 días ${formatMinutesAsHours(avg30)}.`,
      category: "sleep",
      priority: "medium",
      confidence: ratio >= 0.18 ? "high" : "medium",
      date: snapshot.asOfDate,
    };
  }

  return {
    key: "worse-vs-usual",
    type: "warning",
    title: `Esta semana duermes un ${formatEsPercent(Math.abs(ratio))} menos que tu media`,
    description:
      "Una bajada clara de sueño puede explicar peor entreno o más hambre.",
    evidence: `Media 7 días ${formatMinutesAsHours(avg7)} vs media 30 días ${formatMinutesAsHours(avg30)}.`,
    category: "sleep",
    priority: "medium",
    confidence: Math.abs(ratio) >= 0.18 ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Fija horarios unos días y evita encadenar noches cortas.",
  };
}

/** Several short nights → concrete rest recommendation. */
function severalShortNights(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const avg7 = snapshot.sleep.duration.average("7d");
  const trend7 = snapshot.sleep.duration.trend("7d");
  if (avg7 == null || avg7 >= SHORT_NIGHT_AVG_MIN) return null;
  if (snapshot.sleep.count < 4) return null;

  const trendingDown = trend7?.direction === "down";
  const delta7 = snapshot.sleep.duration.delta("7d");
  const dropping =
    delta7 != null &&
    isMeaningfulAbsolute(delta7.absolute, 20) &&
    delta7.absolute < 0;

  if (!trendingDown && !dropping && avg7 >= 6 * 60) return null;

  return {
    key: "short-nights",
    type: "recommendation",
    title: "Prioriza el descanso antes del próximo entreno",
    description:
      "Llevas varias noches cortas. Forzar el gym ahora suele salir caro en rendimiento.",
    evidence: `Media de 7 días en ${formatMinutesAsHours(avg7)} (por debajo de 6,5 h).`,
    category: "sleep",
    priority: "high",
    confidence: avg7 < 6 * 60 ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Recupera con 1–2 noches más largas antes de un entreno duro.",
  };
}

export const sleepInsightsRule: InsightRule = {
  id: "sleep.summary",
  category: "sleep",
  evaluate(snapshot) {
    const short = severalShortNights(snapshot);
    if (short) return [short];
    return [sleepVsUsual(snapshot)].filter(
      (c): c is InsightCandidate => c != null,
    );
  },
};
