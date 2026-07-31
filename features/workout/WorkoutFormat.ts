import { differenceInCalendarDays, format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { WorkoutSession } from "@/lib/storage/trainingStorage";
import type { SessionSummaryStats, SetSnapshot } from "./WorkoutTypes";

export function formatDurationMinutes(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
}

export function formatApproxDuration(minutes: number): string {
  return `~${minutes} min`;
}

export function formatExerciseCount(count: number): string {
  return count === 1 ? "1 ejercicio" : `${count} ejercicios`;
}

export function formatSetProgress(current: number, total: number): string {
  return `Serie ${current} de ${total}`;
}

export function formatExerciseProgress(current: number, total: number): string {
  return `${current}/${total}`;
}

export function formatRestClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatVolumeKg(volume: number): string {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: volume % 1 === 0 ? 0 : 1,
  }).format(volume);
}

export function formatLoadDisplay(load: number): string {
  return new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: load % 1 === 0 ? 0 : 1,
    minimumFractionDigits: load % 1 === 0 ? 0 : 1,
  }).format(load);
}

/** Discrete last-trained label for routine cards. */
export function formatLastTrainedLabel(sessionDate: string): string {
  const date = parse(sessionDate, "yyyy-MM-dd", new Date());
  if (Number.isNaN(date.getTime())) return "";

  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "Última vez · Hoy";
  if (days === 1) return "Última vez · Ayer";
  if (days < 14) return `Última vez · Hace ${days} días`;
  return `Último entrenamiento · ${format(date, "d MMM", { locale: es })}`;
}

/** Compact date for pre-summary context (Hoy / Ayer / Hace N días / d MMM). */
export function formatLastSessionDate(sessionDate: string): string {
  const date = parse(sessionDate, "yyyy-MM-dd", new Date());
  if (Number.isNaN(date.getTime())) return "";

  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 14) return `Hace ${days} días`;
  return format(date, "d MMM", { locale: es });
}

/** Compact set line for logging context, e.g. "52,5 kg · 9 reps · RIR 2". */
export function formatSetSnapshotLine(set: SetSnapshot): string {
  if (set.durationSeconds != null) {
    return `${set.durationSeconds} s`;
  }

  const parts: string[] = [];
  if (set.load != null) {
    parts.push(`${formatLoadDisplay(set.load)} kg`);
  }
  if (set.repetitions != null) {
    parts.push(`${set.repetitions} reps`);
  }
  if (set.rir != null) {
    parts.push(`RIR ${set.rir}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function formatRepRange(min: number, max: number): string {
  if (min === max) return `${min} reps`;
  return `${min}–${max} reps`;
}

export function parseDraftNumber(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export function todaySessionDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function computeSessionStats(
  session: WorkoutSession,
): SessionSummaryStats {
  const start = session.startTime
    ? new Date(session.startTime).getTime()
    : new Date(session.createdAt).getTime();
  const end = session.endTime
    ? new Date(session.endTime).getTime()
    : Date.now();
  const durationMinutes = Math.max(
    1,
    Math.round((end - start) / 60_000),
  );

  let setsCompleted = 0;
  let volumeKg = 0;

  for (const exercise of session.exercises) {
    for (const set of exercise.sets) {
      setsCompleted += 1;
      if (set.load != null && set.repetitions != null) {
        volumeKg += set.load * set.repetitions;
      }
    }
  }

  const exercisesCompleted = session.exercises.filter(
    (exercise) =>
      exercise.status === "completed" || exercise.sets.length > 0,
  ).length;

  return {
    durationMinutes: session.durationMinutes ?? durationMinutes,
    setsCompleted,
    volumeKg,
    exercisesCompleted,
    exerciseTotal: session.exercises.length,
  };
}
