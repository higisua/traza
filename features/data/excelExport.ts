import type { CollectedLiveData } from "./collectData";
import { buildDomainTables } from "./flatTables";
import type { DateRange, ExportContentKey, ExportPeriodPreset } from "./schema";
import { formatRangeLabelEs } from "./period";
import { downloadBlob, stampFilename } from "./download";
import { AnalyticsService } from "@/features/analytics/AnalyticsService";
import { InsightsService } from "@/features/insights/InsightsService";
import type ExcelJS from "exceljs";

function addRowsSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  rows: Array<Record<string, string | number | boolean | null>>,
) {
  const sheet = workbook.addWorksheet(name.slice(0, 31));
  if (rows.length === 0) {
    sheet.addRow(["(sin registros)"]);
    return;
  }
  const headers = Object.keys(rows[0]!);
  sheet.addRow(headers);
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    sheet.addRow(headers.map((h) => row[h] ?? ""));
  }
  sheet.columns.forEach((col) => {
    col.width = 16;
  });
}

function fmtDelta(
  value: number | null | undefined,
  unit: string,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)} ${unit}`;
}

export async function exportExcelWorkbook(options: {
  data: CollectedLiveData;
  selected: ReadonlySet<ExportContentKey>;
  range: DateRange;
  preset: ExportPeriodPreset;
}): Promise<{ filename: string; sheetCount: number }> {
  const ExcelJS = (await import("exceljs")).default;
  const tables = buildDomainTables(options.data, options.selected, options.range);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TRAZA";
  workbook.created = new Date();

  const snapshot = AnalyticsService.compute({
    weight: options.data.weightEntries,
    bloodPressure: options.data.bloodPressureEntries,
    sleep: options.data.sleepEntries,
    steps: options.data.stepEntries,
    measurements: options.data.bodyMeasurements,
    workouts: options.data.workoutSessions,
    asOfDate: options.range.endDate,
  });
  const insights = InsightsService.fromSnapshot(snapshot);

  // README first — ChatGPT-friendly orientation
  const readme = workbook.addWorksheet("README");
  const readmeLines: Array<[string, string]> = [
    ["TRAZA — Guía del Excel", ""],
    ["", ""],
    [
      "Para qué sirve",
      "Este libro resume tu evolución para analizarla (entrenador o ChatGPT). Empieza aquí, luego Resumen, después las hojas de dominio.",
    ],
    ["Periodo", formatRangeLabelEs(options.range, options.preset)],
    ["Desde", options.range.startDate],
    ["Hasta", options.range.endDate],
    ["Generado", new Date().toISOString()],
    ["", ""],
    ["Cómo interpretar", ""],
    [
      "Fechas",
      "ISO YYYY-MM-DD. occurredAt / performedAt en ISO completo cuando existe.",
    ],
    [
      "Números",
      "Unidades en el nombre de columna (weightKg, waistCm, loadKg, durationMinutes).",
    ],
    [
      "Nulos",
      "Celdas vacías = sin dato. No inventes valores al analizar.",
    ],
    [
      "Orden sugerido para ChatGPT",
      "1) README  2) Resumen  3) Peso / Medidas / Entrenamientos / Series  4) Insights / Analytics",
    ],
    ["", ""],
    ["Hojas de este libro", "Contenido"],
    ["Resumen", "Periodo, conteos, cambios principales, corporal, entrenamiento, recuperación"],
  ];
  for (const table of tables) {
    readmeLines.push([
      table.sheetName,
      sheetGuideEs(table.id, table.rows[0] ? Object.keys(table.rows[0]) : []),
    ]);
  }
  readmeLines.push(
    ["", ""],
    [
      "Columnas frecuentes",
      "entryDate, weightKg, bodyFatPercent, waistCm, steps, durationMinutes, sleepScore, systolicMmHg, exerciseName, loadKg, repetitions, rir, recordKind",
    ],
    [
      "Nota",
      "TRAZA no envía nada a la nube. Tú pegas o adjuntas este archivo donde quieras analizarlo.",
    ],
  );
  for (const [a, b] of readmeLines) {
    const row = readme.addRow([a, b]);
    if (a && !b) row.font = { bold: true, size: a.startsWith("TRAZA") ? 14 : 11 };
  }
  readme.columns = [{ width: 28 }, { width: 72 }];

  const resumen = workbook.addWorksheet("Resumen");
  resumen.addRow(["TRAZA — Resumen"]);
  resumen.getRow(1).font = { bold: true, size: 14 };
  resumen.addRow(["Periodo", formatRangeLabelEs(options.range, options.preset)]);
  resumen.addRow(["Desde", options.range.startDate]);
  resumen.addRow(["Hasta", options.range.endDate]);
  resumen.addRow(["Generado", new Date().toISOString()]);
  resumen.addRow([]);

  resumen.addRow(["Número de registros"]);
  resumen.getRow(resumen.rowCount).font = { bold: true };
  resumen.addRow(["Dominio", "Registros"]);
  resumen.getRow(resumen.rowCount).font = { bold: true };

  const setCount = options.data.workoutSessions.reduce(
    (n, s) => n + s.exercises.reduce((m, e) => m + e.sets.length, 0),
    0,
  );
  const countRows: Array<[string, number]> = [
    ["Peso", options.data.weightEntries.length],
    [
      "Grasa corporal",
      options.data.weightEntries.filter((e) => e.bodyFatPct != null).length,
    ],
    ["Medición corporal", options.data.bodyMeasurements.length],
    ["Pasos", options.data.stepEntries.length],
    ["Sueño", options.data.sleepEntries.length],
    ["Tensión", options.data.bloodPressureEntries.length],
    ["Entrenamientos", options.data.workoutSessions.length],
    ["Series", setCount],
  ];
  for (const [label, count] of countRows) {
    resumen.addRow([label, count]);
  }

  resumen.addRow([]);
  resumen.addRow(["Principales cambios"]);
  resumen.getRow(resumen.rowCount).font = { bold: true };
  const wDelta = snapshot.weight.delta("30d");
  const bfDelta = snapshot.bodyFat.delta("30d");
  resumen.addRow(["Peso (30d)", fmtDelta(wDelta?.absolute, "kg")]);
  resumen.addRow(["Grasa (30d)", fmtDelta(bfDelta?.absolute, "%")]);
  resumen.addRow([
    "Tendencia peso",
    snapshot.weight.trend("30d")?.direction ?? "—",
  ]);
  resumen.addRow(["Insights activos", insights.insights.length]);

  resumen.addRow([]);
  resumen.addRow(["Resumen corporal"]);
  resumen.getRow(resumen.rowCount).font = { bold: true };
  resumen.addRow([
    "Peso actual",
    snapshot.weight.last != null ? `${snapshot.weight.last.toFixed(1)} kg` : "—",
  ]);
  resumen.addRow([
    "Grasa corporal",
    snapshot.bodyFat.last != null ? `${snapshot.bodyFat.last.toFixed(1)} %` : "—",
  ]);
  resumen.addRow([
    "Cintura",
    snapshot.measurements.waist?.last != null
      ? `${snapshot.measurements.waist.last.toFixed(1)} cm`
      : "—",
  ]);

  resumen.addRow([]);
  resumen.addRow(["Resumen entrenamiento"]);
  resumen.getRow(resumen.rowCount).font = { bold: true };
  resumen.addRow(["Sesiones", snapshot.workout.totalWorkouts]);
  resumen.addRow([
    "Volumen total",
    `${Math.round(snapshot.workout.totalVolumeKg)} kg`,
  ]);
  resumen.addRow(["Series", snapshot.workout.totalSets]);
  resumen.addRow([
    "Sesiones / semana",
    snapshot.workout.workoutsPerWeek != null
      ? snapshot.workout.workoutsPerWeek.toFixed(1)
      : "—",
  ]);
  resumen.addRow([
    "Ejercicio más frecuente",
    snapshot.workout.mostPerformedExercise?.nameEs ?? "—",
  ]);

  resumen.addRow([]);
  resumen.addRow(["Resumen recuperación"]);
  resumen.getRow(resumen.rowCount).font = { bold: true };
  resumen.addRow([
    "Sueño medio",
    snapshot.sleep.meanDurationMinutes != null
      ? `${Math.round(snapshot.sleep.meanDurationMinutes)} min`
      : "—",
  ]);
  resumen.addRow([
    "Puntuación sueño",
    snapshot.sleep.meanScore != null
      ? String(Math.round(snapshot.sleep.meanScore))
      : "—",
  ]);
  resumen.addRow([
    "Tensión media",
    snapshot.bloodPressure.meanSystolic != null
      ? `${Math.round(snapshot.bloodPressure.meanSystolic)}/${Math.round(snapshot.bloodPressure.meanDiastolic ?? 0)}`
      : "—",
  ]);
  resumen.addRow([
    "Pasos medios (30d)",
    snapshot.steps.average("30d") != null
      ? String(Math.round(snapshot.steps.average("30d")!))
      : "—",
  ]);

  resumen.columns = [{ width: 28 }, { width: 28 }];

  for (const table of tables) {
    addRowsSheet(workbook, table.sheetName, table.rows);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const filename = stampFilename("traza_excel", "xlsx");
  downloadBlob(blob, filename);
  return { filename, sheetCount: tables.length + 2 };
}

function sheetGuideEs(id: string, columns: string[]): string {
  const colHint =
    columns.length > 0
      ? ` Columnas: ${columns.slice(0, 8).join(", ")}${columns.length > 8 ? "…" : ""}.`
      : "";
  switch (id) {
    case "weight":
      return `Registros de peso corporal.${colHint}`;
    case "bodyFat":
      return `Registros con % de grasa (composición).${colHint}`;
    case "measurements":
      return `Cintura, brazo y pierna en cm.${colHint}`;
    case "steps":
      return `Pasos diarios.${colHint}`;
    case "sleep":
      return `Sueño: duración, puntuación, horarios.${colHint}`;
    case "bloodPressure":
      return `Tensión arterial y pulso.${colHint}`;
    case "workouts":
      return `Sesiones de entrenamiento (una fila por sesión).${colHint}`;
    case "sets":
      return `Series ejecutadas (carga, reps, RIR). Ideal para análisis de fuerza.${colHint}`;
    case "personalRecords":
      return `Récords personales por ejercicio y tipo.${colHint}`;
    case "analytics":
      return `Resumen analítico derivado (deltas y tendencias).${colHint}`;
    case "insights":
      return `Descubrimientos generados por reglas (no IA).${colHint}`;
    default:
      return `Datos del dominio ${id}.${colHint}`;
  }
}
