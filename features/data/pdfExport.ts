/**
 * Informe TRAZA — PDF narrative export (jspdf).
 * Consumes Analytics + Insights via reportNarrative; does not recalculate metrics.
 */

import type { CollectedLiveData } from "./collectData";
import type {
  DateRange,
  ExportContentKey,
  ExportPeriodPreset,
  PdfDetailLevel,
} from "./schema";
import { formatRangeLabelEs } from "./period";
import { downloadBlob, stampFilename } from "./download";
import { AnalyticsService } from "@/features/analytics/AnalyticsService";
import { InsightsService } from "@/features/insights/InsightsService";
import { APP_VERSION } from "./schema";
import {
  buildPdfNarrative,
  type CoachTable,
  type PdfReportNarrative,
} from "./reportNarrative";
import type { jsPDF } from "jspdf";

const LIME: [number, number, number] = [199, 244, 61];
const INK: [number, number, number] = [20, 23, 20];
const MUTED: [number, number, number] = [107, 115, 107];
const PAPER: [number, number, number] = [248, 249, 244];
const SOFT: [number, number, number] = [232, 236, 224];

type DocCtx = {
  doc: jsPDF;
  pageW: number;
  margin: number;
  y: number;
};

export async function exportPdfReport(options: {
  data: CollectedLiveData;
  selected: ReadonlySet<ExportContentKey>;
  range: DateRange;
  preset: ExportPeriodPreset;
  detail?: PdfDetailLevel;
}): Promise<{ filename: string; pageCount: number }> {
  const detail = options.detail ?? "full";
  const { jsPDF } = await import("jspdf");
  const snapshot = AnalyticsService.compute({
    weight: options.data.weightEntries,
    bloodPressure: options.data.bloodPressureEntries,
    sleep: options.data.sleepEntries,
    steps: options.data.stepEntries,
    measurements: options.data.bodyMeasurements,
    workouts: options.data.workoutSessions,
    asOfDate: options.range.endDate,
  });
  const insights = InsightsService.fromSnapshot(snapshot, { maxInsights: 8 });

  const narrative = buildPdfNarrative({
    snapshot,
    insights: insights.insights,
    range: options.range,
    selected: options.selected,
    detail,
    data: options.data,
    weightChartValues: options.data.weightEntries
      .map((e) => e.weightKg)
      .slice(0, 24)
      .reverse(),
  });

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const ctx: DocCtx = {
    doc,
    pageW: doc.internal.pageSize.getWidth(),
    margin: 18,
    y: 0,
  };

  drawCover(ctx, narrative, options);
  drawExecutive(ctx, narrative);

  if (detail !== "summary") {
    drawComposition(ctx, narrative);
    drawTraining(ctx, narrative);
    drawRecovery(ctx, narrative);
    drawActivity(ctx, narrative);
    drawPersonalRecords(ctx, narrative);
    drawDiscoveries(ctx, narrative);
  }

  drawFinalConclusion(ctx, narrative);

  if (detail === "coach" && narrative.coachAppendix) {
    drawCoachAppendix(ctx, narrative.coachAppendix.tables);
  }

  const blob = doc.output("blob");
  const filename = stampFilename("traza_informe", "pdf");
  downloadBlob(blob, filename);
  return { filename, pageCount: doc.getNumberOfPages() };
}

function drawCover(
  ctx: DocCtx,
  narrative: PdfReportNarrative,
  options: {
    range: DateRange;
    preset: ExportPeriodPreset;
  },
) {
  const { doc, pageW, margin } = ctx;
  doc.setFillColor(...PAPER);
  doc.rect(0, 0, pageW, 297, "F");
  doc.setFillColor(...LIME);
  doc.rect(0, 0, pageW, 52, "F");
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.text("TRAZA", margin, 28);
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.text("Informe de evolución", margin, 40);
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text("Narrativa de tu progreso · generado en local", margin, 47);

  let y = 68;
  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("PERIODO", margin, y);
  y += 8;
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(formatRangeLabelEs(options.range, options.preset), margin, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `${options.range.startDate}  →  ${options.range.endDate}`,
    margin,
    y,
  );
  y += 18;

  doc.setFillColor(...SOFT);
  const tagWrapped = doc.splitTextToSize(
    narrative.coverTagline,
    pageW - margin * 2 - 12,
  );
  const tagBoxH = 12 + tagWrapped.length * 5.5;
  doc.roundedRect(margin, y, pageW - margin * 2, tagBoxH, 3, 3, "F");
  doc.setTextColor(...INK);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(11);
  doc.text(tagWrapped, margin + 6, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(
    `Generado ${new Date().toLocaleString("es-ES")} · App ${APP_VERSION}`,
    margin,
    278,
  );
  doc.text(`Nivel: ${narrative.detailLabel}`, margin, 284);
}

function drawExecutive(ctx: DocCtx, narrative: PdfReportNarrative) {
  newPage(ctx);
  let y = sectionHeader(ctx, "Resumen ejecutivo");
  y = writeLead(
    ctx,
    y,
    "Lo esencial del periodo, en menos de dos minutos.",
  );

  for (const msg of narrative.executiveMessages) {
    y = ensureSpace(ctx, y, 28);
    const boxTop = y;
    const label = msg.label.toUpperCase();
    const wrapped = ctx.doc.splitTextToSize(
      msg.text,
      ctx.pageW - ctx.margin * 2 - 12,
    );
    const boxH = 16 + wrapped.length * 5.5;
    ctx.doc.setFillColor(...SOFT);
    ctx.doc.roundedRect(
      ctx.margin,
      boxTop,
      ctx.pageW - ctx.margin * 2,
      boxH,
      3,
      3,
      "F",
    );
    ctx.doc.setFillColor(...LIME);
    ctx.doc.circle(ctx.margin + 3.5, boxTop + 5.2, 1.3, "F");
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(9);
    ctx.doc.setTextColor(...MUTED);
    ctx.doc.text(label, ctx.margin + 6, boxTop + 6);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(12);
    ctx.doc.setTextColor(...INK);
    ctx.doc.text(wrapped, ctx.margin + 6, boxTop + 13);
    y = boxTop + boxH + 6;
  }

  footerNote(ctx);
  ctx.y = y;
}

function drawComposition(ctx: DocCtx, narrative: PdfReportNarrative) {
  if (!narrative.composition) return;
  newPage(ctx);
  let y = sectionHeader(ctx, "Composición corporal");
  y = writeLead(ctx, y, narrative.composition.mainMessage);

  for (const ind of narrative.composition.indicators) {
    y = ensureSpace(ctx, y, 32);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(12);
    ctx.doc.setTextColor(...INK);
    ctx.doc.text(ind.name, ctx.margin, y);
    y += 6;
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(11);
    ctx.doc.text(`${ind.valueLine}  ·  ${ind.changeLine}`, ctx.margin, y);
    y += 6;
    ctx.doc.setTextColor(...MUTED);
    ctx.doc.setFontSize(10);
    const wrapped = ctx.doc.splitTextToSize(
      ind.interpretation,
      ctx.pageW - ctx.margin * 2,
    );
    ctx.doc.text(wrapped, ctx.margin, y);
    y += wrapped.length * 5 + 8;
  }

  if (narrative.composition.chartValues.length >= 2) {
    y = ensureSpace(ctx, y, 36);
    y = miniBars(
      ctx,
      y,
      "Ilustración — peso reciente",
      narrative.composition.chartValues,
    );
  }

  y = writeConclusion(ctx, y, narrative.composition.conclusion);
  footerNote(ctx);
  ctx.y = y;
}

function drawTraining(ctx: DocCtx, narrative: PdfReportNarrative) {
  if (!narrative.training) return;
  newPage(ctx);
  let y = sectionHeader(ctx, "Entrenamiento");
  y = writeLead(ctx, y, narrative.training.mainMessage);

  // Rating badge
  ctx.doc.setFillColor(...LIME);
  ctx.doc.roundedRect(ctx.margin, y, 42, 9, 2, 2, "F");
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(10);
  ctx.doc.setTextColor(...INK);
  ctx.doc.text(narrative.training.rating, ctx.margin + 3, y + 6);
  y += 14;

  for (const para of narrative.training.paragraphs) {
    y = ensureSpace(ctx, y, 20);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(11);
    ctx.doc.setTextColor(...INK);
    const wrapped = ctx.doc.splitTextToSize(para, ctx.pageW - ctx.margin * 2);
    ctx.doc.text(wrapped, ctx.margin, y);
    y += wrapped.length * 5.5 + 5;
  }

  y = writeConclusion(ctx, y, narrative.training.conclusion);
  footerNote(ctx);
  ctx.y = y;
}

function drawRecovery(ctx: DocCtx, narrative: PdfReportNarrative) {
  if (!narrative.recovery) return;
  newPage(ctx);
  let y = sectionHeader(ctx, "Recuperación");
  y = writeLead(ctx, y, narrative.recovery.mainMessage);

  for (const para of narrative.recovery.paragraphs) {
    y = ensureSpace(ctx, y, 18);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(11);
    ctx.doc.setTextColor(...INK);
    const wrapped = ctx.doc.splitTextToSize(para, ctx.pageW - ctx.margin * 2);
    ctx.doc.text(wrapped, ctx.margin, y);
    y += wrapped.length * 5.5 + 5;
  }

  if (narrative.recovery.correlation) {
    y = ensureSpace(ctx, y, 28);
    ctx.doc.setFillColor(...SOFT);
    const wrapped = ctx.doc.splitTextToSize(
      narrative.recovery.correlation,
      ctx.pageW - ctx.margin * 2 - 12,
    );
    const boxH = 14 + wrapped.length * 5;
    ctx.doc.roundedRect(
      ctx.margin,
      y,
      ctx.pageW - ctx.margin * 2,
      boxH,
      3,
      3,
      "F",
    );
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(9);
    ctx.doc.setTextColor(...MUTED);
    ctx.doc.text("CORRELACIÓN", ctx.margin + 6, y + 6);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(10);
    ctx.doc.setTextColor(...INK);
    ctx.doc.text(wrapped, ctx.margin + 6, y + 12);
    y += boxH + 8;
  }

  y = writeConclusion(ctx, y, narrative.recovery.conclusion);
  footerNote(ctx);
  ctx.y = y;
}

function drawActivity(ctx: DocCtx, narrative: PdfReportNarrative) {
  if (!narrative.activity) return;
  newPage(ctx);
  let y = sectionHeader(ctx, "Actividad");
  y = writeLead(ctx, y, narrative.activity.mainMessage);

  for (const para of narrative.activity.paragraphs) {
    y = ensureSpace(ctx, y, 18);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(11);
    ctx.doc.setTextColor(...INK);
    const wrapped = ctx.doc.splitTextToSize(para, ctx.pageW - ctx.margin * 2);
    ctx.doc.text(wrapped, ctx.margin, y);
    y += wrapped.length * 5.5 + 5;
  }

  y = writeConclusion(ctx, y, narrative.activity.conclusion);
  footerNote(ctx);
  ctx.y = y;
}

function drawPersonalRecords(ctx: DocCtx, narrative: PdfReportNarrative) {
  if (!narrative.personalRecords) return;
  newPage(ctx);
  let y = sectionHeader(ctx, "Récords personales");
  y = writeLead(ctx, y, narrative.personalRecords.mainMessage);

  for (const medal of narrative.personalRecords.medals) {
    y = ensureSpace(ctx, y, 22);
    ctx.doc.setFillColor(...LIME);
    ctx.doc.circle(ctx.margin + 4, y + 2, 3, "F");
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(12);
    ctx.doc.setTextColor(...INK);
    ctx.doc.text(medal.headline, ctx.margin + 12, y + 3);
    y += 8;
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(10);
    ctx.doc.setTextColor(...MUTED);
    ctx.doc.text(medal.detail, ctx.margin + 12, y);
    y += 10;
  }

  y = writeConclusion(ctx, y, narrative.personalRecords.conclusion);
  footerNote(ctx);
  ctx.y = y;
}

function drawDiscoveries(ctx: DocCtx, narrative: PdfReportNarrative) {
  if (!narrative.discoveries) return;
  newPage(ctx);
  let y = sectionHeader(ctx, "Descubrimientos");
  y = writeLead(
    ctx,
    y,
    "Lecturas que no se ven mirando un solo gráfico.",
  );

  for (const card of narrative.discoveries.cards) {
    y = ensureSpace(ctx, y, 30);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(12);
    ctx.doc.setTextColor(...INK);
    const title = ctx.doc.splitTextToSize(
      card.title,
      ctx.pageW - ctx.margin * 2,
    );
    ctx.doc.text(title, ctx.margin, y);
    y += title.length * 5.5 + 3;
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(10);
    ctx.doc.setTextColor(...MUTED);
    const body = ctx.doc.splitTextToSize(
      card.body,
      ctx.pageW - ctx.margin * 2,
    );
    ctx.doc.text(body, ctx.margin, y);
    y += body.length * 4.8 + 10;
  }

  footerNote(ctx);
  ctx.y = y;
}

function drawFinalConclusion(ctx: DocCtx, narrative: PdfReportNarrative) {
  newPage(ctx);
  let y = sectionHeader(ctx, "Conclusión final");
  y = writeLead(ctx, y, "Cierre del periodo, en clave de entrenador.");

  for (const para of narrative.finalConclusion.paragraphs) {
    y = ensureSpace(ctx, y, 22);
    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(12);
    ctx.doc.setTextColor(...INK);
    const wrapped = ctx.doc.splitTextToSize(para, ctx.pageW - ctx.margin * 2);
    ctx.doc.text(wrapped, ctx.margin, y);
    y += wrapped.length * 6 + 8;
  }

  footerNote(ctx);
  ctx.y = y;
}

function drawCoachAppendix(ctx: DocCtx, tables: CoachTable[]) {
  newPage(ctx);
  let y = sectionHeader(ctx, "Anexo técnico");
  y = writeLead(
    ctx,
    y,
    "Tablas para análisis detallado: series, RIR, volumen y PR.",
  );

  for (const table of tables) {
    y = ensureSpace(ctx, y, 40);
    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(12);
    ctx.doc.setTextColor(...INK);
    ctx.doc.text(table.title, ctx.margin, y);
    y += 7;

    ctx.doc.setFont("helvetica", "bold");
    ctx.doc.setFontSize(8);
    ctx.doc.setTextColor(...MUTED);
    const colW =
      (ctx.pageW - ctx.margin * 2) / Math.max(table.headers.length, 1);
    table.headers.forEach((h, i) => {
      ctx.doc.text(h, ctx.margin + i * colW, y, {
        maxWidth: colW - 1,
      });
    });
    y += 5;
    ctx.doc.setDrawColor(...SOFT);
    ctx.doc.line(ctx.margin, y, ctx.pageW - ctx.margin, y);
    y += 4;

    ctx.doc.setFont("helvetica", "normal");
    ctx.doc.setFontSize(7.5);
    ctx.doc.setTextColor(...INK);
    for (const row of table.rows) {
      y = ensureSpace(ctx, y, 8);
      row.forEach((cell, i) => {
        const text = String(cell);
        ctx.doc.text(text.length > 22 ? `${text.slice(0, 20)}…` : text, ctx.margin + i * colW, y, {
          maxWidth: colW - 1,
        });
      });
      y += 4.5;
    }
    y += 8;
  }

  footerNote(ctx);
  ctx.y = y;
}

function newPage(ctx: DocCtx) {
  ctx.doc.addPage();
  ctx.doc.setFillColor(...PAPER);
  ctx.doc.rect(0, 0, ctx.pageW, 297, "F");
  ctx.y = ctx.margin + 6;
}

function sectionHeader(ctx: DocCtx, title: string): number {
  const startY = 24;
  ctx.doc.setFillColor(...LIME);
  ctx.doc.rect(ctx.margin, startY - 6, 3, 8, "F");
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(16);
  ctx.doc.setTextColor(...INK);
  ctx.doc.text(title, ctx.margin + 8, startY);
  return startY + 12;
}

function writeLead(ctx: DocCtx, y: number, text: string): number {
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(12);
  ctx.doc.setTextColor(...INK);
  const wrapped = ctx.doc.splitTextToSize(text, ctx.pageW - ctx.margin * 2);
  ctx.doc.text(wrapped, ctx.margin, y);
  return y + wrapped.length * 5.5 + 8;
}

function writeConclusion(ctx: DocCtx, y: number, text: string): number {
  y = ensureSpace(ctx, y, 24);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(9);
  ctx.doc.setTextColor(...MUTED);
  ctx.doc.text("CONCLUSIÓN", ctx.margin, y);
  y += 6;
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(...INK);
  const wrapped = ctx.doc.splitTextToSize(text, ctx.pageW - ctx.margin * 2);
  ctx.doc.text(wrapped, ctx.margin, y);
  return y + wrapped.length * 5.5 + 4;
}

function ensureSpace(ctx: DocCtx, y: number, need: number): number {
  if (y + need < 275) return y;
  newPage(ctx);
  return ctx.margin + 6;
}

function footerNote(ctx: DocCtx) {
  ctx.doc.setFontSize(8);
  ctx.doc.setTextColor(...MUTED);
  ctx.doc.text(
    "Informe TRAZA · generado en local · sin sincronización en la nube",
    ctx.margin,
    288,
  );
}

function miniBars(
  ctx: DocCtx,
  y: number,
  label: string,
  values: number[],
): number {
  ctx.doc.setFont("helvetica", "normal");
  ctx.doc.setFontSize(8);
  ctx.doc.setTextColor(...MUTED);
  ctx.doc.text(label, ctx.margin, y);
  y += 3;
  if (values.length < 2) return y + 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const barW = 3;
  const gap = 1.2;
  const height = 12;
  let x = ctx.margin;
  for (const v of values.slice(-28)) {
    const h = 3 + ((v - min) / span) * height;
    ctx.doc.setFillColor(...SOFT);
    ctx.doc.rect(x, y + height - h + 3, barW, h, "F");
    x += barW + gap;
  }
  return y + height + 10;
}
