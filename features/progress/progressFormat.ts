import type { AnalyticsPeriod, DeltaResult, TrendDirection } from "@/features/analytics";
import { formatEsNumber, formatEsPercent } from "@/features/insights/format";

export const PERIOD_OPTIONS: {
  value: AnalyticsPeriod;
  label: string;
}[] = [
  { value: "7d", label: "7 d" },
  { value: "30d", label: "30 d" },
  { value: "90d", label: "90 d" },
  { value: "all", label: "Todo" },
];

export const PERIOD_LABEL: Record<AnalyticsPeriod, string> = {
  "7d": "7 días",
  "30d": "30 días",
  "90d": "90 días",
  all: "todo el historial",
};

export type VariationTone = "up" | "down" | "flat" | "neutral";

export type Polarity = "lower_is_better" | "higher_is_better" | "neutral";

export function toneFromDelta(
  absolute: number | null | undefined,
  polarity: Polarity,
  epsilon = 0.01,
): VariationTone {
  if (absolute == null || !Number.isFinite(absolute)) return "neutral";
  if (Math.abs(absolute) < epsilon) return "flat";
  const rising = absolute > 0;
  if (polarity === "neutral") return rising ? "up" : "down";
  if (polarity === "lower_is_better") return rising ? "down" : "up";
  return rising ? "up" : "down";
}

export function toneFromTrend(
  direction: TrendDirection | null | undefined,
  polarity: Polarity,
): VariationTone {
  if (!direction || direction === "flat") return "flat";
  if (polarity === "neutral") {
    return direction === "up" ? "up" : "down";
  }
  if (polarity === "lower_is_better") {
    return direction === "down" ? "up" : "down";
  }
  return direction === "up" ? "up" : "down";
}

export function formatSignedMetric(
  value: number,
  unit: string,
  digits = 1,
): string {
  const body = formatEsNumber(value, { digits, signed: true });
  return unit ? `${body} ${unit}` : body;
}

export function formatDeltaLine(
  delta: DeltaResult | null,
  unit: string,
  digits = 1,
  epsilon = 0.01,
): string | null {
  if (!delta) return null;
  if (Math.abs(delta.absolute) < epsilon) return "Sin cambio relevante";
  return formatSignedMetric(delta.absolute, unit, digits);
}

export function formatAvgLine(
  value: number | null,
  unit: string,
  digits = 1,
): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${formatEsNumber(value, { digits })} ${unit}`;
}

export function formatGoalDaysRatio(ratio: number | null): string | null {
  if (ratio == null || !Number.isFinite(ratio)) return null;
  return `${formatEsPercent(ratio, { digits: 0 })} de días con objetivo`;
}

export function variationClass(tone: VariationTone): string {
  switch (tone) {
    case "up":
      return "text-success";
    case "down":
      return "text-warning";
    case "flat":
      return "text-text-muted";
    default:
      return "text-text-secondary";
  }
}

/** Compact section label — uses design tokens, avoids size-11 trap. */
export const progressSectionLabelClass =
  "text-label font-semibold uppercase tracking-label text-text-muted";

/** First sentence only — keeps Discoveries cards short. */
export function oneSentence(text: string, maxLen = 120): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence =
    match && match[1]!.length >= 12 ? match[1]! : trimmed;
  if (sentence.length <= maxLen) return sentence;
  const cut = sentence.slice(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
