import {
  formatChartDayLabel,
  isNotFutureDate,
  isValidDateInput,
  isValidTimeInput,
  nowDateInputValue,
  nowTimeInputValue,
  toOccurredAt,
} from "@/lib/tracking/dateTime";
import { parseLocaleNumber } from "@/lib/tracking/input";
import { MeasurementRepository } from "./MeasurementRepository";
import type {
  MeasurementChartPoint,
  MeasurementEntry,
  MeasurementEntryInput,
  MeasurementFieldErrors,
  MeasurementMetricDelta,
  MeasurementSummary,
  MeasurementValidationResult,
} from "./MeasurementTypes";

const CM_MIN = 10;
const CM_MAX = 300;

function metricDelta(
  current: number,
  previous: number | null,
): MeasurementMetricDelta {
  return {
    current,
    previous,
    delta: previous !== null ? current - previous : null,
  };
}

function validateCm(
  raw: string,
  emptyError: string,
): { value: number | null; error?: string } {
  const parsed = parseLocaleNumber(raw);
  if (raw.trim() === "" || parsed === null) {
    return { value: null, error: emptyError };
  }
  if (parsed < CM_MIN || parsed > CM_MAX) {
    return {
      value: null,
      error: `Introduce un valor entre ${CM_MIN} y ${CM_MAX} cm`,
    };
  }
  return { value: Math.round(parsed * 10) / 10 };
}

export const MeasurementService = {
  defaultsForCreate(): MeasurementEntryInput {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      waistCm: 0,
      armCm: 0,
      legCm: 0,
    };
  },

  validate(raw: {
    entryDate: string;
    entryTime: string;
    waistCm: string;
    armCm: string;
    legCm: string;
  }): MeasurementValidationResult {
    const errors: MeasurementFieldErrors = {};

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

    const waist = validateCm(raw.waistCm, "La cintura es obligatoria");
    const arm = validateCm(raw.armCm, "El brazo es obligatorio");
    const leg = validateCm(raw.legCm, "La pierna es obligatoria");

    if (waist.error) errors.waistCm = waist.error;
    if (arm.error) errors.armCm = arm.error;
    if (leg.error) errors.legCm = leg.error;

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    return {
      ok: true,
      value: {
        entryDate: raw.entryDate,
        entryTime: raw.entryTime,
        waistCm: waist.value as number,
        armCm: arm.value as number,
        legCm: leg.value as number,
      },
    };
  },

  create(input: MeasurementEntryInput): MeasurementEntry {
    const now = new Date().toISOString();
    return MeasurementRepository.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      waistCm: input.waistCm,
      armCm: input.armCm,
      legCm: input.legCm,
      photos: null,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(id: string, input: MeasurementEntryInput): MeasurementEntry | null {
    const existing = MeasurementRepository.getById(id);
    return MeasurementRepository.update(id, {
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      waistCm: input.waistCm,
      armCm: input.armCm,
      legCm: input.legCm,
      photos: existing?.photos ?? null,
      updatedAt: new Date().toISOString(),
    });
  },

  remove(id: string): boolean {
    return MeasurementRepository.remove(id);
  },

  list(): MeasurementEntry[] {
    return MeasurementRepository.getAll();
  },

  getSummary(): MeasurementSummary {
    const all = MeasurementRepository.getAll();
    const latest = all[0] ?? null;
    const previous = all[1] ?? null;

    if (!latest) {
      return {
        latest: null,
        previous: null,
        waist: null,
        arm: null,
        leg: null,
        count: 0,
      };
    }

    return {
      latest,
      previous,
      count: all.length,
      waist: metricDelta(latest.waistCm, previous?.waistCm ?? null),
      arm: metricDelta(latest.armCm, previous?.armCm ?? null),
      leg: metricDelta(latest.legCm, previous?.legCm ?? null),
    };
  },

  getChartPoints(limit = 30): MeasurementChartPoint[] {
    return MeasurementRepository.getAll()
      .slice(0, limit)
      .reverse()
      .map((entry) => ({
        id: entry.id,
        occurredAt: entry.occurredAt,
        entryDate: entry.entryDate,
        entryTime: entry.entryTime,
        waistCm: entry.waistCm,
        armCm: entry.armCm,
        legCm: entry.legCm,
        label: formatChartDayLabel(entry),
      }));
  },
};
