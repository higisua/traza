/**
 * Analysis prompt for ChatGPT / coach — copied by the user; no AI call.
 * Built from the selected period and report context (not a fixed generic).
 */

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange, ExportFormat, ExportPeriodPreset } from "./schema";
import { formatRangeLabelEs } from "./period";

export type CoachPromptContext = {
  range: DateRange;
  preset: ExportPeriodPreset;
  format: ExportFormat;
  filename?: string | null;
};

function formatLongDateEs(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM", { locale: es });
  } catch {
    return iso;
  }
}

/**
 * Dynamic prompt tailored to period + format of the generated report.
 */
export function buildCoachAnalysisPrompt(ctx: CoachPromptContext): string {
  const { range, preset, format } = ctx;
  const from = formatLongDateEs(range.startDate);
  const to = formatLongDateEs(range.endDate);
  const periodLine =
    preset === "all"
      ? "Analiza mi evolución en todo el historial disponible en TRAZA."
      : `Analiza mi evolución entre el ${from} y el ${to}.`;

  const formatHint =
    format === "pdf"
      ? "El adjunto es un Informe TRAZA (PDF): informe narrativo de mi evolución. Usa el resumen ejecutivo y la conclusión final como punto de partida; el resto del cuerpo interpreta composición, entrenamiento, recuperación y descubrimientos."
      : format === "excel"
        ? "El adjunto es un Excel de TRAZA. Empieza por la hoja README (qué contiene cada hoja y cómo interpretar columnas), luego Resumen y los dominios que necesites."
        : "Los datos vienen de TRAZA (fechas ISO, columnas normalizadas).";

  return `${periodLine}
Periodo del informe: ${formatRangeLabelEs(range, preset)} (${range.startDate} → ${range.endDate}).

Detecta tendencias.
Identifica mejoras.
Encuentra riesgos.
Prioriza los cambios que más impacto puedan tener.
Propón mejoras en entrenamiento, recuperación, sueño, actividad y nutrición si los datos lo permiten.

${formatHint}

Responde en español de España, con recomendaciones concretas y accionables.
No inventes datos que no aparezcan en el informe.`;
}

/** @deprecated Prefer buildCoachAnalysisPrompt with context. */
export const COACH_ANALYSIS_PROMPT_ES = buildCoachAnalysisPrompt({
  range: { startDate: "1970-01-01", endDate: new Date().toISOString().slice(0, 10) },
  preset: "all",
  format: "excel",
});

export async function copyCoachPromptToClipboard(
  ctx?: CoachPromptContext,
): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  const text = ctx
    ? buildCoachAnalysisPrompt(ctx)
    : COACH_ANALYSIS_PROMPT_ES;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
