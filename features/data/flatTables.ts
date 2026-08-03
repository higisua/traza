/**
 * Flat row builders for CSV / Excel — LLM-clear column names.
 */

import type { CollectedLiveData } from "./collectData";
import { exerciseNameMap } from "./collectData";
import type { ExportContentKey } from "./schema";
import { AnalyticsService } from "@/features/analytics/AnalyticsService";
import { InsightsService } from "@/features/insights/InsightsService";
import { computeExerciseRecords } from "@/features/workout/prCompute";
import type { DateRange } from "./schema";

export type FlatRow = Record<string, string | number | boolean | null>;

export type DomainTable = {
  id: string;
  filename: string;
  sheetName: string;
  rows: FlatRow[];
};

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function rowsToCsv(rows: FlatRow[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header])).join(","),
    ),
  ];
  return lines.join("\n");
}

export function buildDomainTables(
  data: CollectedLiveData,
  selected: ReadonlySet<ExportContentKey>,
  range: DateRange,
): DomainTable[] {
  const names = exerciseNameMap(data.exercises);
  const tables: DomainTable[] = [];

  if (selected.has("weight")) {
    tables.push({
      id: "weight",
      filename: "peso.csv",
      sheetName: "Peso",
      rows: data.weightEntries.map((e) => ({
        id: e.id,
        entryDate: e.entryDate,
        entryTime: e.entryTime,
        occurredAt: e.occurredAt,
        weightKg: e.weightKg,
        bodyFatPercent: e.bodyFatPct,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    });
  }

  if (selected.has("bodyFat")) {
    tables.push({
      id: "bodyFat",
      filename: "grasa.csv",
      sheetName: "Grasa corporal",
      rows: data.weightEntries
        .filter((e) => e.bodyFatPct != null)
        .map((e) => ({
          id: e.id,
          entryDate: e.entryDate,
          entryTime: e.entryTime,
          occurredAt: e.occurredAt,
          bodyFatPercent: e.bodyFatPct,
          weightKg: e.weightKg,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        })),
    });
  }

  if (selected.has("measurements")) {
    tables.push({
      id: "measurements",
      filename: "medidas.csv",
      sheetName: "Medidas",
      rows: data.bodyMeasurements.map((e) => ({
        id: e.id,
        entryDate: e.entryDate,
        entryTime: e.entryTime,
        occurredAt: e.occurredAt,
        waistCm: e.waistCm,
        armCm: e.armCm,
        legCm: e.legCm,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    });
  }

  if (selected.has("steps")) {
    tables.push({
      id: "steps",
      filename: "pasos.csv",
      sheetName: "Pasos",
      rows: data.stepEntries.map((e) => ({
        id: e.id,
        entryDate: e.entryDate,
        entryTime: e.entryTime,
        occurredAt: e.occurredAt,
        steps: e.steps,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    });
  }

  if (selected.has("sleep")) {
    tables.push({
      id: "sleep",
      filename: "sueno.csv",
      sheetName: "Sueno",
      rows: data.sleepEntries.map((e) => ({
        id: e.id,
        entryDate: e.entryDate,
        entryTime: e.entryTime,
        occurredAt: e.occurredAt,
        durationMinutes: e.durationMinutes,
        sleepScore: e.score,
        bedTime: e.bedTime,
        wakeTime: e.wakeTime,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    });
  }

  if (selected.has("bloodPressure")) {
    tables.push({
      id: "bloodPressure",
      filename: "tension.csv",
      sheetName: "Tension",
      rows: data.bloodPressureEntries.map((e) => ({
        id: e.id,
        entryDate: e.entryDate,
        entryTime: e.entryTime,
        occurredAt: e.occurredAt,
        systolicMmHg: e.systolic,
        diastolicMmHg: e.diastolic,
        pulseBpm: e.pulse,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      })),
    });
  }

  if (selected.has("workouts")) {
    tables.push({
      id: "workouts",
      filename: "entrenamientos.csv",
      sheetName: "Entrenamientos",
      rows: data.workoutSessions.map((s) => ({
        id: s.id,
        sessionDate: s.sessionDate,
        templateId: s.templateId,
        templateVersionId: s.templateVersionId,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes,
        exerciseCount: s.exercises.length,
        setCount: s.exercises.reduce((n, ex) => n + ex.sets.length, 0),
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  }

  if (selected.has("sets")) {
    const setRows: FlatRow[] = [];
    for (const session of data.workoutSessions) {
      for (const exercise of session.exercises) {
        const exerciseName =
          names.get(exercise.exerciseId) ?? exercise.exerciseId;
        for (const set of exercise.sets) {
          setRows.push({
            setId: set.id,
            sessionId: session.id,
            sessionDate: session.sessionDate,
            exerciseId: exercise.exerciseId,
            exerciseName,
            setNumber: set.setNumber,
            loadKg: set.load,
            repetitions: set.repetitions,
            durationSeconds: set.durationSeconds,
            rir: set.rir ?? null,
            lastSetRir: exercise.lastSetRir,
            exerciseStatus: exercise.status,
            performedAt: session.startTime ?? session.sessionDate,
            createdAt: set.createdAt,
          });
        }
      }
    }
    tables.push({
      id: "sets",
      filename: "series.csv",
      sheetName: "Series",
      rows: setRows,
    });
  }

  if (selected.has("personalRecords")) {
    const prRows: FlatRow[] = [];
    const seen = new Set<string>();
    for (const session of data.workoutSessions) {
      for (const exercise of session.exercises) {
        if (seen.has(exercise.exerciseId)) continue;
        seen.add(exercise.exerciseId);
        const records = computeExerciseRecords(
          data.workoutSessions,
          exercise.exerciseId,
        );
        const exerciseName =
          names.get(exercise.exerciseId) ?? exercise.exerciseId;
        for (const record of records) {
          prRows.push({
            exerciseId: exercise.exerciseId,
            exerciseName,
            recordKind: record.kind,
            loadKg: record.load,
            repetitions: record.repetitions,
            volumeKg: record.volumeKg,
            sessionId: record.sessionId,
            sessionDate: record.sessionDate,
            setId: record.setId,
          });
        }
      }
    }
    tables.push({
      id: "personalRecords",
      filename: "pr.csv",
      sheetName: "PR",
      rows: prRows,
    });
  }

  if (selected.has("insights") || selected.has("analytics")) {
    const snapshot = AnalyticsService.compute({
      weight: data.weightEntries,
      bloodPressure: data.bloodPressureEntries,
      sleep: data.sleepEntries,
      steps: data.stepEntries,
      measurements: data.bodyMeasurements,
      workouts: data.workoutSessions,
      asOfDate: range.endDate,
    });

    if (selected.has("analytics")) {
      const weightDelta = snapshot.weight.delta("30d");
      const bodyFatDelta = snapshot.bodyFat.delta("30d");
      tables.push({
        id: "analytics",
        filename: "analytics.csv",
        sheetName: "Analytics",
        rows: [
          {
            domain: "weight",
            metric: "summary",
            count: snapshot.weight.count,
            last: snapshot.weight.last,
            lastDate: snapshot.weight.lastDate,
            delta30dAbsolute: weightDelta?.absolute ?? null,
            trend30d: snapshot.weight.trend("30d")?.direction ?? null,
          },
          {
            domain: "bodyFat",
            metric: "summary",
            count: snapshot.bodyFat.count,
            last: snapshot.bodyFat.last,
            lastDate: snapshot.bodyFat.lastDate,
            delta30dAbsolute: bodyFatDelta?.absolute ?? null,
            trend30d: snapshot.bodyFat.trend("30d")?.direction ?? null,
          },
          {
            domain: "steps",
            metric: "summary",
            dayCount: snapshot.steps.dayCount,
            lastSteps: snapshot.steps.lastDay?.totalSteps ?? null,
            lastDate: snapshot.steps.lastDay?.entryDate ?? null,
            average30d: snapshot.steps.average("30d"),
            trend30d: snapshot.steps.trend("30d")?.direction ?? null,
          },
          {
            domain: "sleep",
            metric: "summary",
            count: snapshot.sleep.count,
            meanDurationMinutes: snapshot.sleep.meanDurationMinutes,
            meanScore: snapshot.sleep.meanScore,
          },
          {
            domain: "bloodPressure",
            metric: "summary",
            count: snapshot.bloodPressure.count,
            meanSystolic: snapshot.bloodPressure.meanSystolic,
            meanDiastolic: snapshot.bloodPressure.meanDiastolic,
          },
          {
            domain: "workout",
            metric: "summary",
            totalWorkouts: snapshot.workout.totalWorkouts,
            totalVolumeKg: snapshot.workout.totalVolumeKg,
            totalSets: snapshot.workout.totalSets,
            workoutsPerWeek: snapshot.workout.workoutsPerWeek,
          },
        ],
      });
    }

    if (selected.has("insights")) {
      const insights = InsightsService.fromSnapshot(snapshot);
      tables.push({
        id: "insights",
        filename: "insights.csv",
        sheetName: "Insights",
        rows: insights.insights.map((insight) => ({
          id: insight.id,
          type: insight.type,
          category: insight.category,
          priority: insight.priority,
          confidence: insight.confidence,
          title: insight.title,
          description: insight.description,
          ruleId: insight.ruleId,
          date: insight.date ?? null,
          generatedAt: insight.generatedAt,
        })),
      });
    }
  }

  return tables;
}
