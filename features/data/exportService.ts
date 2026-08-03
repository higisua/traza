import {
  collectLiveData,
  filterByRange,
  buildFullBackup,
} from "./collectData";
import { resolveExportRange, formatRangeLabelEs } from "./period";
import { exportCsvZip } from "./csvExport";
import { exportExcelWorkbook } from "./excelExport";
import { exportPdfReport } from "./pdfExport";
import { downloadJson, stampFilename } from "./download";
import { markBackupDone, markExportDone } from "./dataMeta";
import {
  inferPurpose,
  recordExportHistory,
  type ExportHistoryKind,
} from "./exportHistory";
import type {
  ExportContentKey,
  ExportFormat,
  ExportPeriodPreset,
  ExportPurpose,
  DateRange,
  PdfDetailLevel,
} from "./schema";
import { ALL_EXPORT_CONTENT_KEYS } from "./schema";

export type RunExportInput = {
  format: ExportFormat;
  period: ExportPeriodPreset;
  customRange?: Partial<DateRange>;
  content?: ReadonlySet<ExportContentKey> | readonly ExportContentKey[];
  /** JSON full backup always exports everything; derived snapshot included. */
  includeDerivedInJson?: boolean;
  /** History kind — defaults from format. */
  historyKind?: ExportHistoryKind;
  /** Story purpose for history — defaults from kind/format. */
  purpose?: ExportPurpose;
  /** PDF only — resumen / completo / entrenador. */
  pdfDetail?: PdfDetailLevel;
};

export type RunExportResult = {
  format: ExportFormat;
  filename: string;
  detail?: string;
  range: DateRange;
  period: ExportPeriodPreset;
};

function toContentSet(
  content?: ReadonlySet<ExportContentKey> | readonly ExportContentKey[],
): Set<ExportContentKey> {
  if (!content) return new Set(ALL_EXPORT_CONTENT_KEYS);
  if (content instanceof Set) return content;
  return new Set(content);
}

function rememberHistory(
  input: RunExportInput,
  selected: Set<ExportContentKey>,
  isFullBackup: boolean,
  periodLabel: string,
) {
  const kind: ExportHistoryKind =
    input.historyKind ?? (isFullBackup ? "backup" : "export");
  const allSelected =
    selected.size === ALL_EXPORT_CONTENT_KEYS.length || isFullBackup;
  const purpose =
    input.purpose ?? inferPurpose(kind, input.format);

  recordExportHistory({
    at: new Date().toISOString(),
    format: input.format,
    period: input.period,
    periodLabel,
    content: isFullBackup
      ? "backup"
      : allSelected
        ? "all"
        : Array.from(selected),
    kind,
    purpose,
  });
}

/**
 * Orchestrates client-side export. Logic lives outside React.
 */
export async function runExport(
  input: RunExportInput,
): Promise<RunExportResult> {
  if (input.format === "json") {
    const payload = buildFullBackup({
      includeDerived: input.includeDerivedInJson ?? true,
    });
    const filename = stampFilename("traza_copia", "json");
    downloadJson(payload, filename);
    markBackupDone();
    const range = resolveExportRange("all");
    rememberHistory(
      input,
      new Set(ALL_EXPORT_CONTENT_KEYS),
      true,
      "Copia completa",
    );
    return {
      format: "json",
      filename,
      detail: "Copia de seguridad completa",
      range,
      period: "all",
    };
  }

  const range = resolveExportRange(input.period, input.customRange);
  const periodLabel = formatRangeLabelEs(range, input.period);
  const selected = toContentSet(input.content);
  const data = filterByRange(collectLiveData(), range);

  if (input.format === "csv") {
    const result = await exportCsvZip({ data, selected, range });
    markExportDone("csv", { periodLabel });
    rememberHistory(input, selected, false, periodLabel);
    return {
      format: "csv",
      filename: result.filename,
      detail: `${result.fileCount} ficheros CSV`,
      range,
      period: input.period,
    };
  }

  if (input.format === "excel") {
    const result = await exportExcelWorkbook({
      data,
      selected,
      range,
      preset: input.period,
    });
    markExportDone("excel", { periodLabel });
    rememberHistory(input, selected, false, periodLabel);
    return {
      format: "excel",
      filename: result.filename,
      detail: `${result.sheetCount} hojas`,
      range,
      period: input.period,
    };
  }

  const result = await exportPdfReport({
    data,
    selected,
    range,
    preset: input.period,
    detail: input.pdfDetail ?? "full",
  });
  markExportDone("pdf", { periodLabel });
  rememberHistory(input, selected, false, periodLabel);
  return {
    format: "pdf",
    filename: result.filename,
    detail: `${result.pageCount} páginas`,
    range,
    period: input.period,
  };
}
