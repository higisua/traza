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
import { SleepRepository } from "./SleepRepository";
import { classifySleepQuality } from "./SleepFormat";
import type {
  SleepChartPoint,
  SleepEntry,
  SleepEntryInput,
  SleepFieldErrors,
  SleepSummary,
  SleepValidationResult,
} from "./SleepTypes";

const DURATION_MIN = 30;
const DURATION_MAX = 16 * 60;
const SCORE_MIN = 1;
const SCORE_MAX = 100;

export const SleepService = {
  defaultsForCreate(): SleepEntryInput {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      durationMinutes: 0,
      score: null,
      bedTime: null,
      wakeTime: null,
    };
  },

  validate(raw: {
    entryDate: string;
    entryTime: string;
    durationHours: string;
    durationMinutes: string;
    score: string;
    bedTime: string;
    wakeTime: string;
  }): SleepValidationResult {
    const errors: SleepFieldErrors = {};

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

    const hours =
      raw.durationHours.trim() === ""
        ? 0
        : parseLocaleNumber(raw.durationHours);
    const minutes =
      raw.durationMinutes.trim() === ""
        ? 0
        : parseLocaleNumber(raw.durationMinutes);

    if (
      (raw.durationHours.trim() === "" && raw.durationMinutes.trim() === "") ||
      hours === null ||
      minutes === null
    ) {
      errors.durationHours = "La duración es obligatoria";
    } else if (
      hours < 0 ||
      minutes < 0 ||
      minutes > 59 ||
      !Number.isInteger(hours) ||
      !Number.isInteger(minutes)
    ) {
      errors.durationMinutes = "Duración no válida";
    } else {
      const total = hours * 60 + minutes;
      if (total < DURATION_MIN || total > DURATION_MAX) {
        errors.durationHours = "Introduce una duración realista";
      }
    }

    let score: number | null = null;
    if (raw.score.trim() !== "") {
      const parsed = parseLocaleNumber(raw.score);
      if (parsed === null || parsed < SCORE_MIN || parsed > SCORE_MAX) {
        errors.score = `La puntuación debe estar entre ${SCORE_MIN} y ${SCORE_MAX}`;
      } else {
        score = Math.round(parsed);
      }
    }

    let bedTime: string | null = null;
    let wakeTime: string | null = null;

    if (raw.bedTime.trim() !== "") {
      if (!isValidTimeInput(raw.bedTime)) {
        errors.bedTime = "Hora no válida";
      } else {
        bedTime = raw.bedTime;
      }
    }

    if (raw.wakeTime.trim() !== "") {
      if (!isValidTimeInput(raw.wakeTime)) {
        errors.wakeTime = "Hora no válida";
      } else {
        wakeTime = raw.wakeTime;
      }
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    const durationMinutes =
      Math.round(hours as number) * 60 + Math.round(minutes as number);

    return {
      ok: true,
      value: {
        entryDate: raw.entryDate,
        entryTime: raw.entryTime,
        durationMinutes,
        score,
        bedTime,
        wakeTime,
      },
    };
  },

  create(input: SleepEntryInput): SleepEntry {
    const now = new Date().toISOString();
    return SleepRepository.create({
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      durationMinutes: input.durationMinutes,
      score: input.score ?? null,
      bedTime: input.bedTime ?? null,
      wakeTime: input.wakeTime ?? null,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(id: string, input: SleepEntryInput): SleepEntry | null {
    return SleepRepository.update(id, {
      entryDate: input.entryDate,
      entryTime: input.entryTime,
      occurredAt: toOccurredAt(input.entryDate, input.entryTime),
      durationMinutes: input.durationMinutes,
      score: input.score ?? null,
      bedTime: input.bedTime ?? null,
      wakeTime: input.wakeTime ?? null,
      updatedAt: new Date().toISOString(),
    });
  },

  remove(id: string): boolean {
    return SleepRepository.remove(id);
  },

  list(): SleepEntry[] {
    return SleepRepository.getAll();
  },

  listByDate(entryDate: string): SleepEntry[] {
    return SleepRepository.getByDate(entryDate);
  },

  getSummary(): SleepSummary {
    const all = SleepRepository.getAll();
    const latest = all[0] ?? null;
    const previous = all[1] ?? null;

    return {
      latest,
      previous,
      count: all.length,
      quality: latest
        ? classifySleepQuality(latest.durationMinutes, latest.score)
        : null,
    };
  },

  getChartPoints(limit = 14): SleepChartPoint[] {
    return SleepRepository.getAll()
      .slice(0, limit)
      .reverse()
      .map((entry) => ({
        id: entry.id,
        occurredAt: entry.occurredAt,
        entryDate: entry.entryDate,
        entryTime: entry.entryTime,
        durationMinutes: entry.durationMinutes,
        score: entry.score,
        label: formatChartDayLabel(entry),
      }));
  },
};
