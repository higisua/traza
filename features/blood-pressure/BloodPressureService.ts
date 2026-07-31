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
import { BloodPressureRepository } from "./BloodPressureRepository";
import { classifyBloodPressure } from "./BloodPressureFormat";
import type {
  BloodPressureChartPoint,
  BloodPressureEntry,
  BloodPressureEntryInput,
  BloodPressureFieldErrors,
  BloodPressureSummary,
  BloodPressureValidationResult,
} from "./BloodPressureTypes";

const SYS_MIN = 70;
const SYS_MAX = 250;
const DIA_MIN = 40;
const DIA_MAX = 150;
const PULSE_MIN = 30;
const PULSE_MAX = 220;

export const BloodPressureService = {
  defaultsForCreate(): BloodPressureEntryInput {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      systolic: 0,
      diastolic: 0,
      pulse: 0,
    };
  },

  validate(raw: {
    entryDate: string;
    entryTime: string;
    systolic: string;
    diastolic: string;
    pulse: string;
  }): BloodPressureValidationResult {
    const errors: BloodPressureFieldErrors = {};

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

    const systolic = parseLocaleNumber(raw.systolic);
    const diastolic = parseLocaleNumber(raw.diastolic);
    const pulse = parseLocaleNumber(raw.pulse);

    if (raw.systolic.trim() === "" || systolic === null) {
      errors.systolic = "La sistólica es obligatoria";
    } else if (systolic < SYS_MIN || systolic > SYS_MAX) {
      errors.systolic = `Introduce un valor entre ${SYS_MIN} y ${SYS_MAX}`;
    }

    if (raw.diastolic.trim() === "" || diastolic === null) {
      errors.diastolic = "La diastólica es obligatoria";
    } else if (diastolic < DIA_MIN || diastolic > DIA_MAX) {
      errors.diastolic = `Introduce un valor entre ${DIA_MIN} y ${DIA_MAX}`;
    }

    if (
      systolic !== null &&
      diastolic !== null &&
      !errors.systolic &&
      !errors.diastolic &&
      systolic <= diastolic
    ) {
      errors.systolic = "La sistólica debe ser mayor que la diastólica";
    }

    if (raw.pulse.trim() === "" || pulse === null) {
      errors.pulse = "El pulso es obligatorio";
    } else if (pulse < PULSE_MIN || pulse > PULSE_MAX) {
      errors.pulse = `Introduce un valor entre ${PULSE_MIN} y ${PULSE_MAX}`;
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    return {
      ok: true,
      value: {
        entryDate: raw.entryDate,
        entryTime: raw.entryTime,
        systolic: Math.round(systolic as number),
        diastolic: Math.round(diastolic as number),
        pulse: Math.round(pulse as number),
      },
    };
  },

  create(input: BloodPressureEntryInput): BloodPressureEntry {
    const now = new Date().toISOString();
    return BloodPressureRepository.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      systolic: input.systolic,
      diastolic: input.diastolic,
      pulse: input.pulse,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(id: string, input: BloodPressureEntryInput): BloodPressureEntry | null {
    return BloodPressureRepository.update(id, {
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      systolic: input.systolic,
      diastolic: input.diastolic,
      pulse: input.pulse,
      updatedAt: new Date().toISOString(),
    });
  },

  remove(id: string): boolean {
    return BloodPressureRepository.remove(id);
  },

  list(): BloodPressureEntry[] {
    return BloodPressureRepository.getAll();
  },

  listByDate(entryDate: string): BloodPressureEntry[] {
    return BloodPressureRepository.getByDate(entryDate);
  },

  getSummary(): BloodPressureSummary {
    const all = BloodPressureRepository.getAll();
    const latest = all[0] ?? null;
    const previous = all[1] ?? null;

    return {
      latest,
      previous,
      count: all.length,
      category: latest
        ? classifyBloodPressure(latest.systolic, latest.diastolic)
        : null,
    };
  },

  getChartPoints(limit = 30): BloodPressureChartPoint[] {
    return BloodPressureRepository.getAll()
      .slice(0, limit)
      .reverse()
      .map((entry) => ({
        id: entry.id,
        occurredAt: entry.occurredAt,
        entryDate: entry.entryDate,
        entryTime: entry.entryTime,
        systolic: entry.systolic,
        diastolic: entry.diastolic,
        label: formatChartDayLabel(entry),
      }));
  },
};
