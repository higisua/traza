import type { AnalyticsSnapshot } from "@/features/analytics";
import { WorkoutCatalog } from "@/features/workout/WorkoutCatalog";
import type { InsightCandidate, InsightRule } from "../types";
import { formatEsNumber, isRecentDate } from "../format";

function lifetimeWeeklyAvg(snapshot: AnalyticsSnapshot): number {
  const { totalVolumeKg, totalWorkouts, workoutsPerWeek } = snapshot.workout;
  if (workoutsPerWeek == null || workoutsPerWeek <= 0 || totalWorkouts < 4) {
    return 0;
  }
  const weeksSpanned = totalWorkouts / workoutsPerWeek;
  return weeksSpanned > 0 ? totalVolumeKg / weeksSpanned : 0;
}

/**
 * Snapshot lacks week-over-week workout counts. We approximate “more than usual”
 * by comparing this week’s volume to lifetime weekly average volume.
 */
function volumeAboveUsual(snapshot: AnalyticsSnapshot): InsightCandidate | null {
  const { weeklyVolumeKg, totalWorkouts, workoutsPerWeek } = snapshot.workout;
  if (totalWorkouts < 4 || weeklyVolumeKg <= 0 || workoutsPerWeek == null) {
    return null;
  }

  const avg = lifetimeWeeklyAvg(snapshot);
  if (avg <= 0) return null;
  const ratio = weeklyVolumeKg / avg;
  if (ratio < 1.35) return null;

  return {
    key: "volume-above-usual",
    type: "trend",
    title: "Esta semana llevas claramente más volumen de lo habitual",
    description:
      "El volumen semanal supera con holgura tu media — progresión si la recuperación acompaña.",
    evidence: `Volumen 7 días ${formatEsNumber(weeklyVolumeKg, { digits: 0 })} kg vs media semanal ≈ ${formatEsNumber(avg, { digits: 0 })} kg.`,
    category: "workout",
    priority: ratio >= 1.6 ? "high" : "medium",
    confidence: ratio >= 1.6 ? "high" : "medium",
    date: snapshot.asOfDate,
  };
}

/** Behavioral: trained much less this week vs usual. */
function volumeWellBelowUsual(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const { weeklyVolumeKg, totalWorkouts, workoutsPerWeek } = snapshot.workout;
  if (totalWorkouts < 6 || workoutsPerWeek == null) return null;
  if (snapshot.streaks.trainingWeeks < 2) return null;

  const avg = lifetimeWeeklyAvg(snapshot);
  if (avg <= 0) return null;

  // Need a clear drop — not a rest week blip.
  if (weeklyVolumeKg >= avg * 0.55) return null;

  const pctDown = 1 - weeklyVolumeKg / avg;

  return {
    key: "volume-drop",
    type: "warning",
    title: "Esta semana has entrenado mucho menos de lo habitual",
    description:
      "El volumen está claramente por debajo de tu ritmo. Si no es descanso planeado, vuelve al gym.",
    evidence: `Volumen 7d ${formatEsNumber(weeklyVolumeKg, { digits: 0 })} kg vs media ≈ ${formatEsNumber(avg, { digits: 0 })} kg (−${formatEsNumber(pctDown * 100, { digits: 0 })} %).`,
    category: "workout",
    priority: "high",
    confidence: pctDown >= 0.55 ? "high" : "medium",
    date: snapshot.asOfDate,
    action: "Abre Traza y programa la próxima sesión esta semana.",
  };
}

function recentPersonalRecord(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const recent: { name: string; kind: string; date: string }[] = [];

  for (const ex of snapshot.workout.personalRecords) {
    for (const rec of ex.records) {
      if (!isRecentDate(rec.sessionDate, snapshot.asOfDate, 10)) continue;
      recent.push({
        name: ex.nameEs,
        kind: rec.kind,
        date: rec.sessionDate,
      });
    }
  }

  if (recent.length === 0) return null;
  recent.sort((a, b) => b.date.localeCompare(a.date));
  const top = recent[0];
  const kindLabel =
    top.kind === "max_load"
      ? "carga máxima"
      : top.kind === "max_reps"
        ? "repeticiones"
        : "volumen de serie";

  return {
    key: "recent-pr",
    type: "achievement",
    title: `Nuevo récord personal: ${top.name}`,
    description:
      "Un PR reciente confirma que el plan no es solo volumen vacío.",
    evidence: `PR de ${kindLabel} el ${top.date}${recent.length > 1 ? ` (y ${recent.length - 1} más en 10 días)` : ""}.`,
    category: "workout",
    priority: recent.length >= 2 ? "high" : "medium",
    confidence: "high",
    date: top.date,
  };
}

function trainingConsistency(
  snapshot: AnalyticsSnapshot,
): InsightCandidate | null {
  const weeks = snapshot.streaks.trainingWeeks;
  const perWeek = snapshot.workout.workoutsPerWeek;

  if (weeks < 4) return null;

  return {
    key: "training-streak",
    type: "achievement",
    title: `Llevas ${weeks} semanas seguidas entrenando`,
    description:
      "La frecuencia sostenida suele importar más que una semana heroica.",
    evidence:
      perWeek != null
        ? `Ritmo medio histórico ≈ ${formatEsNumber(perWeek, { digits: 1 })} sesiones/semana.`
        : "Racha semanal encadenada sin huecos.",
    category: "workout",
    priority: weeks >= 6 ? "high" : "medium",
    confidence: "high",
    date: snapshot.asOfDate,
  };
}

/**
 * Hit catalog rep ceiling on a recent PR with enough session history
 * → concrete load bump (~2,5 kg). Snapshot has one max_reps PR per exercise;
 * we require ≥3 total workouts as proxy for repeated practice.
 */
function tryLoadIncrease(snapshot: AnalyticsSnapshot): InsightCandidate | null {
  if (snapshot.workout.totalWorkouts < 3) return null;

  type Hit = {
    name: string;
    reps: number;
    max: number;
    min: number;
    date: string;
    load: number | null;
    sessionCountHint: number;
  };
  const hits: Hit[] = [];

  for (const ex of snapshot.workout.personalRecords) {
    const maxReps = ex.records.find((r) => r.kind === "max_reps");
    if (!maxReps || maxReps.repetitions == null) continue;
    if (!isRecentDate(maxReps.sessionDate, snapshot.asOfDate, 21)) continue;

    const catalog = WorkoutCatalog.getExercise(ex.exerciseId);
    const range = catalog?.defaultRepRange;
    if (!range || range.max == null) continue;
    if (maxReps.repetitions < range.max) continue;

    const sessionCountHint =
      snapshot.workout.mostPerformedExercise?.exerciseId === ex.exerciseId
        ? snapshot.workout.mostPerformedExercise.sessionCount
        : snapshot.workout.totalWorkouts;

    hits.push({
      name: ex.nameEs,
      reps: maxReps.repetitions,
      max: range.max,
      min: range.min,
      date: maxReps.sessionDate,
      load: maxReps.load,
      sessionCountHint,
    });
  }

  if (hits.length === 0) return null;
  hits.sort((a, b) => b.date.localeCompare(a.date));
  const top = hits[0];

  // Prefer exercises practiced enough times to justify a load jump.
  if (top.sessionCountHint < 3) return null;

  const loadBit =
    top.load != null
      ? ` con ${formatEsNumber(top.load, { digits: 1 })} kg`
      : "";
  const nextLoad =
    top.load != null
      ? `${formatEsNumber(top.load + 2.5, { digits: 1 })} kg`
      : "~2,5 kg más";

  return {
    key: "try-load-increase",
    type: "recommendation",
    title: `Sube ~2,5 kg en ${top.name}: ya tocas el techo de reps`,
    description: `Has llegado a ${top.reps} reps (techo ${top.max}) con historial de sesiones. Si la técnica está limpia, toca cargar un poco más.`,
    evidence: `${top.reps} reps${loadBit} el ${top.date}; rango catálogo ${top.min}–${top.max}; ~${top.sessionCountHint} sesiones del movimiento.`,
    category: "workout",
    priority: "high",
    confidence: top.sessionCountHint >= 3 && hits.length >= 1 ? "high" : "medium",
    date: snapshot.asOfDate,
    action: `Próxima sesión: ${nextLoad} y vuelve a ${top.min}–${Math.max(top.min, top.max - 2)} reps.`,
  };
}

export const workoutInsightsRule: InsightRule = {
  id: "workout.summary",
  category: "workout",
  evaluate(snapshot) {
    return [
      tryLoadIncrease(snapshot),
      volumeWellBelowUsual(snapshot),
      volumeAboveUsual(snapshot),
      recentPersonalRecord(snapshot),
      trainingConsistency(snapshot),
    ].filter((c): c is InsightCandidate => c != null);
  },
};
