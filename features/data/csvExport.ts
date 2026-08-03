import type { CollectedLiveData } from "./collectData";
import { buildDomainTables, rowsToCsv } from "./flatTables";
import type { DateRange, ExportContentKey } from "./schema";
import { downloadBlob, stampFilename } from "./download";

export async function exportCsvZip(options: {
  data: CollectedLiveData;
  selected: ReadonlySet<ExportContentKey>;
  range: DateRange;
}): Promise<{ filename: string; fileCount: number }> {
  const JSZip = (await import("jszip")).default;
  const tables = buildDomainTables(options.data, options.selected, options.range);
  const zip = new JSZip();

  for (const table of tables) {
    const csv = rowsToCsv(table.rows);
    const body =
      csv.length > 0
        ? csv
        : `# empty — no rows for ${table.id}\n`;
    zip.file(table.filename, `\uFEFF${body}`);
  }

  const readme = [
    "TRAZA — exportación CSV",
    `Periodo: ${options.range.startDate} … ${options.range.endDate}`,
    `Ficheros: ${tables.map((t) => t.filename).join(", ")}`,
    "",
    "Optimizado para ChatGPT y hojas de cálculo.",
    "Columnas claras (weightKg, bodyFatPercent, waistCm, performedAt, …).",
    "Fechas ISO (YYYY-MM-DD). Separador: coma. Sin abreviaturas ambiguas.",
  ].join("\n");
  zip.file("LEEME.txt", readme);

  const blob = await zip.generateAsync({ type: "blob" });
  const filename = stampFilename("traza_csv", "zip");
  downloadBlob(blob, filename);
  return { filename, fileCount: tables.length };
}
