import type { AnalyticsSnapshot } from "@/features/analytics";
import type { InsightCandidate, InsightRule } from "../types";
import { formatEsNumber, isMeaningfulAbsolute } from "../format";

/**
 * Sustained BP improvement — observational, coach tone (not clinical).
 * “Mean in optimal range” and elevated-category medical warnings are deleted.
 */
function improvedVsLastMonth(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const sys = snapshot.bloodPressure.systolic.delta("30d");
  const dia = snapshot.bloodPressure.diastolic.delta("30d");
  if (snapshot.bloodPressure.count < 4) return null;
  if (!sys && !dia) return null;

  const sysDown =
    sys != null && isMeaningfulAbsolute(sys.absolute, 3) && sys.absolute < 0;
  const diaDown =
    dia != null && isMeaningfulAbsolute(dia.absolute, 2) && dia.absolute < 0;
  if (!sysDown && !diaDown) return null;

  const parts: string[] = [];
  if (sysDown && sys) {
    parts.push(
      `sistólica ${formatEsNumber(sys.from, { digits: 0 })} → ${formatEsNumber(sys.to, { digits: 0 })}`,
    );
  }
  if (diaDown && dia) {
    parts.push(
      `diastólica ${formatEsNumber(dia.from, { digits: 0 })} → ${formatEsNumber(dia.to, { digits: 0 })}`,
    );
  }

  return {
    key: "improved-month",
    type: "trend",
    title: "Tus lecturas de presión han mejorado este mes",
    description:
      "Comparado con hace 30 días, las cifras bajan de forma relevante en tus registros.",
    evidence: parts.join("; ") + ".",
    category: "blood_pressure",
    priority: "medium",
    confidence: sysDown && diaDown ? "high" : "medium",
    date: snapshot.asOfDate,
  };
}

export const bloodPressureInsightsRule: InsightRule = {
  id: "blood_pressure.summary",
  category: "blood_pressure",
  evaluate(snapshot) {
    return [improvedVsLastMonth(snapshot)].filter(
      (c): c is InsightCandidate => c != null,
    );
  },
};
