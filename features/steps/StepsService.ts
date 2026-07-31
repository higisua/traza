import {
  isNotFutureDate,
  isValidDateInput,
  isValidTimeInput,
  nowDateInputValue,
  nowTimeInputValue,
  toOccurredAt,
} from "@/lib/tracking/dateTime";
import { parseLocaleNumber } from "@/lib/tracking/input";
import { getDailyStepsGoal } from "./StepsGoal";
import { buildDayProgress, formatChartDayLabel } from "./StepsFormat";
import { StepsRepository } from "./StepsRepository";
import type {
  StepsChartPoint,
  StepsEntry,
  StepsEntryInput,
  StepsFieldErrors,
  StepsSummary,
  StepsValidationResult,
} from "./StepsTypes";

const STEPS_MIN = 1;
const STEPS_MAX = 200_000;

export const StepsService = {
  getGoal(): number {
    return getDailyStepsGoal();
  },

  defaultsForCreate(): StepsEntryInput {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      steps: 0,
    };
  },

  validate(raw: {
    entryDate: string;
    entryTime: string;
    steps: string;
  }): StepsValidationResult {
    const errors: StepsFieldErrors = {};

    if (!raw.entryDate.trim()) {
      errors.entryDate = "La fecha es obligatoria";
    } else if (!isValidDateInput(raw.entryDate)) {
      errors.entryDate = "Fecha no válida";
    } else if (!isNotFutureDate(raw.entryDate)) {
      errors.entryDate = "La fecha no puede ser futura";
    }

    if (!raw.entryTime.trim()) {
      errors.entryTime = "La hora es obligatoria";
    } else if (!isValidTimeInput(raw.entryTime)) {
      errors.entryTime = "Hora no válida";
    }

    const steps = parseLocaleNumber(raw.steps);
    if (raw.steps.trim() === "" || steps === null) {
      errors.steps = "Los pasos son obligatorios";
    } else if (
      !Number.isInteger(steps) ||
      steps < STEPS_MIN ||
      steps > STEPS_MAX
    ) {
      errors.steps = `Introduce un valor entre ${STEPS_MIN.toLocaleString("es-ES")} y ${STEPS_MAX.toLocaleString("es-ES")}`;
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    return {
      ok: true,
      value: {
        entryDate: raw.entryDate,
        entryTime: raw.entryTime,
        steps: Math.round(steps as number),
      },
    };
  },

  create(input: StepsEntryInput): StepsEntry {
    const now = new Date().toISOString();
    return StepsRepository.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      steps: input.steps,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(id: string, input: StepsEntryInput): StepsEntry | null {
    return StepsRepository.update(id, {
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      steps: input.steps,
      updatedAt: new Date().toISOString(),
    });
  },

  remove(id: string): boolean {
    return StepsRepository.remove(id);
  },

  list(): StepsEntry[] {
    return StepsRepository.getAll();
  },

  sumForDate(entryDate: string): number {
    return StepsRepository.getByDate(entryDate).reduce(
      (sum, entry) => sum + entry.steps,
      0,
    );
  },

  getSummary(): StepsSummary {
    const all = StepsRepository.getAll();
    const todayDate = nowDateInputValue();
    const todayTotal = this.sumForDate(todayDate);

    return {
      latest: all[0] ?? null,
      today: buildDayProgress(todayDate, todayTotal),
      count: all.length,
    };
  },

  getChartPoints(limit = 14): StepsChartPoint[] {
    const goal = getDailyStepsGoal();
    const byDate = new Map<string, number>();

    for (const entry of StepsRepository.getAll()) {
      byDate.set(
        entry.entryDate,
        (byDate.get(entry.entryDate) ?? 0) + entry.steps,
      );
    }

    return [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-limit)
      .map(([entryDate, totalSteps]) => ({
        entryDate,
        totalSteps,
        goal,
        label: formatChartDayLabel(entryDate),
        goalReached: totalSteps >= goal,
      }));
  },
};
