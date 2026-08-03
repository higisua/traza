import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  parseBackupJson,
  applyBackup,
  migrateBackupPayload,
  TRAZA_EXPORT_SCHEMA_VERSION,
  buildFullBackup,
  resolveExportRange,
} from "@/features/data";
import { buildDomainTables, rowsToCsv } from "@/features/data/flatTables";
import { WeightRepository } from "@/features/weight/WeightRepository";
import { ExerciseRepository } from "@/features/exercises/exerciseRepository";
import { RoutineRepository } from "@/features/routines/routineRepository";
import { trainingStorage } from "@/lib/storage/trainingStorage";

beforeEach(() => {
  vi.stubGlobal("window", {
    localStorage: (() => {
      const store = new Map<string, string>();
      return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      };
    })(),
  });
  ExerciseRepository._resetSeedGate();
  ExerciseRepository.clear();
  ExerciseRepository._resetSeedGate();
  RoutineRepository._resetSeedGate();
  RoutineRepository.clear();
  RoutineRepository._resetSeedGate();
  trainingStorage.clearSessions();
  WeightRepository.clear();
});

describe("resolveExportRange", () => {
  it("resolves 7d inclusive window", () => {
    const now = new Date("2026-08-03T12:00:00.000Z");
    const range = resolveExportRange("7d", undefined, now);
    expect(range.endDate).toBe("2026-08-03");
    expect(range.startDate).toBe("2026-07-28");
  });

  it("swaps inverted custom range", () => {
    const range = resolveExportRange("custom", {
      startDate: "2026-08-10",
      endDate: "2026-08-01",
    });
    expect(range.startDate).toBe("2026-08-01");
    expect(range.endDate).toBe("2026-08-10");
  });
});

describe("backup schema", () => {
  it("builds full backup with schemaVersion", () => {
    WeightRepository.create({
      entryDate: "2026-08-01",
      entryTime: "08:00",
      occurredAt: "2026-08-01T08:00:00.000Z",
      weightKg: 80,
      bodyFatPct: 15,
      createdAt: "2026-08-01T08:00:00.000Z",
      updatedAt: "2026-08-01T08:00:00.000Z",
    });

    const backup = buildFullBackup({ includeDerived: false });
    expect(backup.schemaVersion).toBe(TRAZA_EXPORT_SCHEMA_VERSION);
    expect(backup.kind).toBe("full_backup");
    expect(backup.weightEntries).toHaveLength(1);
    expect(backup.exercises.length).toBeGreaterThan(0);
  });

  it("parses and round-trips JSON", () => {
    const backup = buildFullBackup({ includeDerived: false });
    const parsed = parseBackupJson(JSON.stringify(backup));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.summary.recordCounts.exercises).toBe(
      backup.exercises.length,
    );
  });

  it("rejects invalid JSON", () => {
    expect(parseBackupJson("{").ok).toBe(false);
  });

  it("migrates unknown missing arrays to empty", () => {
    const { payload } = migrateBackupPayload({
      schemaVersion: 1,
      appVersion: "0.1.0",
      exportedAt: "2026-08-03T00:00:00.000Z",
      kind: "full_backup",
    });
    expect(payload.weightEntries).toEqual([]);
    expect(payload.schemaVersion).toBe(1);
  });
});

describe("restore merge/replace", () => {
  it("replace overwrites weight entries", () => {
    WeightRepository.create({
      id: "local-1",
      entryDate: "2026-08-01",
      entryTime: "08:00",
      occurredAt: "2026-08-01T08:00:00.000Z",
      weightKg: 80,
      bodyFatPct: null,
      createdAt: "2026-08-01T08:00:00.000Z",
      updatedAt: "2026-08-01T08:00:00.000Z",
    });

    const backup = buildFullBackup({ includeDerived: false });
    backup.weightEntries = [
      {
        id: "bak-1",
        entryDate: "2026-07-01",
        entryTime: "09:00",
        occurredAt: "2026-07-01T09:00:00.000Z",
        weightKg: 79,
        bodyFatPct: null,
        createdAt: "2026-07-01T09:00:00.000Z",
        updatedAt: "2026-07-01T09:00:00.000Z",
      },
    ];

    applyBackup(backup, "replace");
    expect(WeightRepository.getAll()).toHaveLength(1);
    expect(WeightRepository.getAll()[0]?.id).toBe("bak-1");
  });

  it("merge keeps both ids and prefers newer on conflict", () => {
    WeightRepository.create({
      id: "shared",
      entryDate: "2026-08-01",
      entryTime: "08:00",
      occurredAt: "2026-08-01T08:00:00.000Z",
      weightKg: 80,
      bodyFatPct: null,
      createdAt: "2026-08-01T08:00:00.000Z",
      updatedAt: "2026-08-01T08:00:00.000Z",
    });

    const backup = buildFullBackup({ includeDerived: false });
    backup.weightEntries = [
      {
        id: "shared",
        entryDate: "2026-08-02",
        entryTime: "08:00",
        occurredAt: "2026-08-02T08:00:00.000Z",
        weightKg: 79.5,
        bodyFatPct: null,
        createdAt: "2026-08-01T08:00:00.000Z",
        updatedAt: "2026-08-02T10:00:00.000Z",
      },
      {
        id: "only-backup",
        entryDate: "2026-07-01",
        entryTime: "09:00",
        occurredAt: "2026-07-01T09:00:00.000Z",
        weightKg: 81,
        bodyFatPct: null,
        createdAt: "2026-07-01T09:00:00.000Z",
        updatedAt: "2026-07-01T09:00:00.000Z",
      },
    ];

    applyBackup(backup, "merge");
    const all = WeightRepository.getAll();
    expect(all.find((e) => e.id === "shared")?.weightKg).toBe(79.5);
    expect(all.find((e) => e.id === "only-backup")).toBeTruthy();
  });
});

describe("csv rows", () => {
  it("emits clear headers", () => {
    const tables = buildDomainTables(
      {
        weightEntries: [
          {
            id: "w1",
            entryDate: "2026-08-01",
            entryTime: "08:00",
            occurredAt: "2026-08-01T08:00:00.000Z",
            weightKg: 80,
            bodyFatPct: 14.2,
            createdAt: "2026-08-01T08:00:00.000Z",
            updatedAt: "2026-08-01T08:00:00.000Z",
          },
        ],
        bloodPressureEntries: [],
        sleepEntries: [],
        stepEntries: [],
        bodyMeasurements: [],
        workoutSessions: [],
        exercises: [],
      },
      new Set(["weight", "bodyFat", "personalRecords", "analytics"]),
      { startDate: "2026-01-01", endDate: "2026-12-31" },
    );
    const csv = rowsToCsv(tables[0]!.rows);
    expect(csv).toContain("weightKg");
    expect(csv).toContain("bodyFatPercent");
    expect(csv).toContain("80");
    expect(tables.map((t) => t.filename)).toEqual(
      expect.arrayContaining(["peso.csv", "grasa.csv", "pr.csv", "analytics.csv"]),
    );
  });
});

describe("export history metadata", () => {
  it("records format, purpose and period without files", async () => {
    const {
      recordExportHistory,
      listExportHistory,
      historyTypeLabelEs,
      historyPurposeLabelEs,
    } = await import("@/features/data/exportHistory");
    recordExportHistory({
      at: "2026-08-03T10:00:00.000Z",
      format: "pdf",
      period: "30d",
      periodLabel: "Últimos 30 días",
      content: "all",
      kind: "coach",
      purpose: "chatgpt",
    });
    const list = listExportHistory();
    expect(list[0]?.format).toBe("pdf");
    expect(list[0]?.purpose).toBe("chatgpt");
    expect(historyTypeLabelEs(list[0]!.format)).toBe("Informe TRAZA");
    expect(historyPurposeLabelEs(list[0]!)).toBe("Compartido con ChatGPT");
  });
});

describe("coach prompt", () => {
  it("embeds selected period dates", async () => {
    const { buildCoachAnalysisPrompt } = await import(
      "@/features/data/coachPrompt"
    );
    const prompt = buildCoachAnalysisPrompt({
      range: { startDate: "2026-07-05", endDate: "2026-08-03" },
      preset: "custom",
      format: "excel",
    });
    expect(prompt).toContain("5 de julio");
    expect(prompt).toContain("3 de agosto");
    expect(prompt).toContain("README");
    expect(prompt).toContain("Detecta tendencias");
  });
});

describe("report narrative", () => {
  it("builds natural conclusions and highlights", async () => {
    const { AnalyticsService } = await import(
      "@/features/analytics/AnalyticsService"
    );
    const { buildHighlights, buildNaturalConclusions } = await import(
      "@/features/data/reportNarrative"
    );
    const snapshot = AnalyticsService.compute({
      weight: [],
      bloodPressure: [],
      sleep: [],
      steps: [],
      measurements: [],
      workouts: [],
      asOfDate: "2026-08-03",
    });
    const highlights = buildHighlights(snapshot, {
      startDate: "2026-07-01",
      endDate: "2026-08-03",
    });
    expect(highlights.length).toBeGreaterThan(0);
    const conclusions = buildNaturalConclusions(snapshot, 0);
    expect(conclusions.some((c) => c.includes("entren"))).toBe(true);
    expect(conclusions.join(" ")).not.toMatch(/es consistente/);
  });

  it("builds full narrative with human sleep duration and three detail levels", async () => {
    const { AnalyticsService } = await import(
      "@/features/analytics/AnalyticsService"
    );
    const {
      buildPdfNarrative,
      formatDurationHm,
    } = await import("@/features/data/reportNarrative");
    const { PDF_DETAIL_COPY_ES } = await import("@/features/data/schema");

    expect(formatDurationHm(366)).toBe("6 h 06 min");
    expect(formatDurationHm(420)).toBe("7 h");
    expect(Object.keys(PDF_DETAIL_COPY_ES)).toEqual([
      "summary",
      "full",
      "coach",
    ]);

    const snapshot = AnalyticsService.compute({
      weight: [
        {
          id: "w1",
          entryDate: "2026-07-05",
          entryTime: "08:00",
          occurredAt: "2026-07-05T08:00:00.000Z",
          weightKg: 80,
          bodyFatPct: 16,
          createdAt: "2026-07-05T08:00:00.000Z",
          updatedAt: "2026-07-05T08:00:00.000Z",
        },
        {
          id: "w2",
          entryDate: "2026-08-01",
          entryTime: "08:00",
          occurredAt: "2026-08-01T08:00:00.000Z",
          weightKg: 79.8,
          bodyFatPct: 15.5,
          createdAt: "2026-08-01T08:00:00.000Z",
          updatedAt: "2026-08-01T08:00:00.000Z",
        },
      ],
      bloodPressure: [],
      sleep: [
        {
          id: "s1",
          entryDate: "2026-08-01",
          entryTime: "07:00",
          occurredAt: "2026-08-01T07:00:00.000Z",
          durationMinutes: 366,
          score: 75,
          bedTime: "22:30",
          wakeTime: "04:36",
          createdAt: "2026-08-01T07:00:00.000Z",
          updatedAt: "2026-08-01T07:00:00.000Z",
        },
      ],
      steps: [],
      measurements: [],
      workouts: [],
      asOfDate: "2026-08-03",
    });

    const all = new Set([
      "weight",
      "bodyFat",
      "measurements",
      "sleep",
      "bloodPressure",
      "steps",
      "workouts",
      "sets",
      "personalRecords",
      "insights",
      "analytics",
    ] as const);

    const summary = buildPdfNarrative({
      snapshot,
      insights: [],
      range: { startDate: "2026-07-01", endDate: "2026-08-03" },
      selected: new Set(all),
      detail: "summary",
    });
    expect(summary.executiveMessages.length).toBeGreaterThan(0);
    expect(summary.executiveMessages.length).toBeLessThanOrEqual(5);
    expect(summary.composition).toBeNull();
    expect(summary.finalConclusion.paragraphs.length).toBeGreaterThan(0);
    expect(summary.coverTagline.length).toBeGreaterThan(10);

    const full = buildPdfNarrative({
      snapshot,
      insights: [],
      range: { startDate: "2026-07-01", endDate: "2026-08-03" },
      selected: new Set(all),
      detail: "full",
    });
    expect(full.composition).not.toBeNull();
    expect(full.recovery?.mainMessage).toMatch(/6 h 06 min/);
    expect(full.recovery?.mainMessage).not.toMatch(/366/);
    expect(full.coachAppendix).toBeNull();

    const coach = buildPdfNarrative({
      snapshot,
      insights: [],
      range: { startDate: "2026-07-01", endDate: "2026-08-03" },
      selected: new Set(all),
      detail: "coach",
      data: {
        weightEntries: [],
        bloodPressureEntries: [],
        sleepEntries: [],
        stepEntries: [],
        bodyMeasurements: [],
        workoutSessions: [],
        exercises: [],
      },
    });
    expect(coach.composition).not.toBeNull();
    // Empty sessions → appendix may be null or analytics-only
    expect(coach.detailLabel).toBe("Entrenador");
  });

  it("skips deselected domains in narrative", async () => {
    const { AnalyticsService } = await import(
      "@/features/analytics/AnalyticsService"
    );
    const { buildPdfNarrative } = await import(
      "@/features/data/reportNarrative"
    );
    const snapshot = AnalyticsService.compute({
      weight: [],
      bloodPressure: [],
      sleep: [],
      steps: [],
      measurements: [],
      workouts: [],
      asOfDate: "2026-08-03",
    });
    const narrative = buildPdfNarrative({
      snapshot,
      insights: [],
      range: { startDate: "2026-07-01", endDate: "2026-08-03" },
      selected: new Set(["workouts"]),
      detail: "full",
    });
    expect(narrative.training).not.toBeNull();
    expect(narrative.composition).toBeNull();
    expect(narrative.recovery).toBeNull();
    expect(narrative.activity).toBeNull();
    expect(narrative.discoveries).toBeNull();
  });
});
