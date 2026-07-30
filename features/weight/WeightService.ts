import { WeightRepository } from "./WeightRepository";
import {
  nowDateInputValue,
  nowTimeInputValue,
  parseLocaleNumber,
  toOccurredAt,
} from "./WeightFormat";
import type {
  WeightChartPoint,
  WeightEntry,
  WeightEntryInput,
  WeightFieldErrors,
  WeightSummary,
  WeightTrendDirection,
  WeightValidationResult,
} from "./WeightTypes";
import { formatChartLabel } from "./WeightFormat";

const WEIGHT_MIN = 20;
const WEIGHT_MAX = 400;
const BODY_FAT_MIN = 1;
const BODY_FAT_MAX = 70;

function trendFromDelta(delta: number, epsilon = 0.01): WeightTrendDirection {
  if (Math.abs(delta) < epsilon) return "flat";
  return delta > 0 ? "up" : "down";
}

function isValidDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const [y, m, d] = value.split("-").map(Number);
  return (
    date.getFullYear() === y &&
    date.getMonth() + 1 === m &&
    date.getDate() === d
  );
}

function isValidTimeInput(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export const WeightService = {
  defaultsForCreate(): WeightEntryInput {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      weightKg: 0,
      bodyFatPct: null,
    };
  },

  validate(raw: {
    entryDate: string;
    entryTime: string;
    weightKg: string;
    bodyFatPct: string;
  }): WeightValidationResult {
    const errors: WeightFieldErrors = {};

    if (!raw.entryDate.trim()) {
      errors.entryDate = "La fecha es obligatoria";
    } else if (!isValidDateInput(raw.entryDate)) {
      errors.entryDate = "Fecha no válida";
    } else {
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      const selected = new Date(`${raw.entryDate}T12:00:00`);
      if (selected.getTime() > endOfToday.getTime()) {
        errors.entryDate = "La fecha no puede ser futura";
      }
    }

    if (!raw.entryTime.trim()) {
      errors.entryTime = "La hora es obligatoria";
    } else if (!isValidTimeInput(raw.entryTime)) {
      errors.entryTime = "Hora no válida";
    }

    const weight = parseLocaleNumber(raw.weightKg);
    if (raw.weightKg.trim() === "" || weight === null) {
      errors.weightKg = "El peso es obligatorio";
    } else if (weight < WEIGHT_MIN || weight > WEIGHT_MAX) {
      errors.weightKg = `Introduce un peso entre ${WEIGHT_MIN} y ${WEIGHT_MAX} kg`;
    }

    let bodyFat: number | null = null;
    if (raw.bodyFatPct.trim() !== "") {
      const parsed = parseLocaleNumber(raw.bodyFatPct);
      if (parsed === null) {
        errors.bodyFatPct = "Porcentaje no válido";
      } else if (parsed < BODY_FAT_MIN || parsed > BODY_FAT_MAX) {
        errors.bodyFatPct = `La grasa debe estar entre ${BODY_FAT_MIN} y ${BODY_FAT_MAX} %`;
      } else {
        bodyFat = parsed;
      }
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    return {
      ok: true,
      value: {
        entryDate: raw.entryDate,
        entryTime: raw.entryTime,
        weightKg: weight as number,
        bodyFatPct: bodyFat,
      },
    };
  },

  create(input: WeightEntryInput): WeightEntry {
    const now = new Date().toISOString();
    return WeightRepository.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct ?? null,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(id: string, input: WeightEntryInput): WeightEntry | null {
    return WeightRepository.update(id, {
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      weightKg: input.weightKg,
      bodyFatPct: input.bodyFatPct ?? null,
      updatedAt: new Date().toISOString(),
    });
  },

  remove(id: string): boolean {
    return WeightRepository.remove(id);
  },

  list(): WeightEntry[] {
    return WeightRepository.getAll();
  },

  getById(id: string): WeightEntry | null {
    return WeightRepository.getById(id);
  },

  /** Ready for Calendar day sheets. */
  listByDate(entryDate: string): WeightEntry[] {
    return WeightRepository.getByDate(entryDate);
  },

  getSummary(): WeightSummary {
    const all = WeightRepository.getAll();
    const latest = all[0] ?? null;
    const previous = all[1] ?? null;

    return {
      latest,
      previous,
      count: all.length,
      weightTrend:
        latest && previous
          ? trendFromDelta(latest.weightKg - previous.weightKg)
          : null,
      bodyFatTrend:
        latest &&
        previous &&
        latest.bodyFatPct !== null &&
        previous.bodyFatPct !== null
          ? trendFromDelta(latest.bodyFatPct - previous.bodyFatPct, 0.05)
          : null,
    };
  },

  getChartPoints(limit = 30): WeightChartPoint[] {
    const points = WeightRepository.getAll()
      .slice(0, limit)
      .reverse()
      .map((entry) => ({
        id: entry.id,
        occurredAt: entry.occurredAt,
        entryDate: entry.entryDate,
        entryTime: entry.entryTime,
        weightKg: entry.weightKg,
        label: formatChartLabel(entry),
      }));
    return points;
  },
};
