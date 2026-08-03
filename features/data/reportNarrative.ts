/**
 * Narrative / copy layer for Informe TRAZA (PDF).
 * Maps Analytics snapshot + Insights discoveries → Spanish (Spain) paragraphs.
 * Does not recalculate metrics — consumes engines only.
 */

import type { AnalyticsSnapshot } from "@/features/analytics";
import type { Insight } from "@/features/insights";
import type { CollectedLiveData } from "./collectData";
import { exerciseNameMap } from "./collectData";
import type {
  DateRange,
  ExportContentKey,
  PdfDetailLevel,
} from "./schema";
import { PDF_DETAIL_COPY_ES } from "./schema";

export type NarrativeLabeledMessage = {
  label: string;
  text: string;
};

export type CompositionIndicator = {
  name: string;
  valueLine: string;
  changeLine: string;
  interpretation: string;
};

export type PrMedal = {
  headline: string;
  detail: string;
};

export type DiscoveryCard = {
  title: string;
  body: string;
};

export type CoachTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type TrainingRating = "Muy buena" | "Buena" | "Mejorable";

export type PdfReportNarrative = {
  coverTagline: string;
  detailLabel: string;
  executiveMessages: NarrativeLabeledMessage[];
  composition: {
    mainMessage: string;
    indicators: CompositionIndicator[];
    conclusion: string;
    chartValues: number[];
  } | null;
  training: {
    mainMessage: string;
    rating: TrainingRating;
    paragraphs: string[];
    conclusion: string;
  } | null;
  recovery: {
    mainMessage: string;
    paragraphs: string[];
    correlation: string | null;
    conclusion: string;
  } | null;
  activity: {
    mainMessage: string;
    paragraphs: string[];
    conclusion: string;
  } | null;
  personalRecords: {
    mainMessage: string;
    medals: PrMedal[];
    conclusion: string;
  } | null;
  discoveries: {
    cards: DiscoveryCard[];
  } | null;
  finalConclusion: {
    paragraphs: string[];
  };
  coachAppendix: {
    tables: CoachTable[];
  } | null;
};

const COVER_TAGLINES = [
  "No se trata de entrenar más. Se trata de entrenar mejor.",
  "La constancia deja huella. Este informe la lee.",
  "Menos ruido. Más señales claras.",
  "Tu cuerpo habla en datos. Aquí los convertimos en decisiones.",
  "El progreso no siempre se ve en la báscula.",
  "Entrenar bien empieza por entender qué ya funciona.",
] as const;

const MAIN_MOVEMENT_PATTERNS = new Set([
  "Squat",
  "Hinge",
  "Horizontal Push",
  "Vertical Push",
  "Horizontal Pull",
  "Vertical Pull",
  "Lunge",
]);

function abs(n: number): number {
  return Math.abs(n);
}

function fmtEs(n: number, digits = 1): string {
  return n.toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

function fmtSigned(n: number, digits = 1, unit: string): string {
  const rounded = Math.round(n * 10 ** digits) / 10 ** digits;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${fmtEs(Math.abs(rounded), digits)} ${unit}`;
}

/** Sleep NEVER as minutes alone — always hours and minutes. */
export function formatDurationHm(totalMinutes: number): string {
  const mins = Math.max(0, Math.round(totalMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, "0")} min`;
}

function pickTagline(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return COVER_TAGLINES[hash % COVER_TAGLINES.length]!;
}

function countPrsInRange(
  snapshot: AnalyticsSnapshot,
  range: DateRange,
): number {
  let count = 0;
  for (const exercise of snapshot.workout.personalRecords) {
    for (const record of exercise.records) {
      if (
        record.sessionDate >= range.startDate &&
        record.sessionDate <= range.endDate
      ) {
        count += 1;
      }
    }
  }
  return count;
}

function prsInRange(
  snapshot: AnalyticsSnapshot,
  range: DateRange,
): Array<{
  nameEs: string;
  kind: string;
  load: number | null;
  repetitions: number | null;
  volumeKg: number;
  sessionDate: string;
  isMain: boolean;
}> {
  const out: Array<{
    nameEs: string;
    kind: string;
    load: number | null;
    repetitions: number | null;
    volumeKg: number;
    sessionDate: string;
    isMain: boolean;
  }> = [];

  for (const exercise of snapshot.workout.personalRecords) {
    for (const record of exercise.records) {
      if (
        record.sessionDate < range.startDate ||
        record.sessionDate > range.endDate
      ) {
        continue;
      }
      out.push({
        nameEs: exercise.nameEs,
        kind: record.kind,
        load: record.load,
        repetitions: record.repetitions,
        volumeKg: record.volumeKg,
        sessionDate: record.sessionDate,
        isMain: false,
      });
    }
  }

  // Prefer max_load, then volume, then reps; highest load first.
  out.sort((a, b) => {
    const kindRank = (k: string) =>
      k === "max_load" ? 0 : k === "max_volume" ? 1 : 2;
    const kr = kindRank(a.kind) - kindRank(b.kind);
    if (kr !== 0) return kr;
    return (b.load ?? b.volumeKg) - (a.load ?? a.volumeKg);
  });

  return out;
}

function markMainLifts(
  medals: ReturnType<typeof prsInRange>,
  data: CollectedLiveData | undefined,
): ReturnType<typeof prsInRange> {
  if (!data) return medals;
  return medals.map((m) => {
    const exercise = data.exercises.find((e) => e.nameEs === m.nameEs);
    const pattern = exercise?.movementPattern;
    const isMain =
      (pattern != null && MAIN_MOVEMENT_PATTERNS.has(pattern)) ||
      (exercise?.recordingType === "strength" &&
        (exercise.equipment === "Barbell" ||
          exercise.equipment === "Barra" ||
          /sentadilla|peso muerto|press banca|press militar|dominada|remo/i.test(
            m.nameEs,
          )));
    return { ...m, isMain: Boolean(isMain) };
  });
}

function kindLabelEs(kind: string): string {
  if (kind === "max_load") return "carga máxima";
  if (kind === "max_reps") return "máximas repeticiones";
  return "máximo volumen en serie";
}

function trainingRating(snapshot: AnalyticsSnapshot): TrainingRating {
  const wpw = snapshot.workout.workoutsPerWeek;
  if (snapshot.workout.totalWorkouts === 0) return "Mejorable";
  if (wpw != null && wpw >= 3) return "Muy buena";
  if (wpw != null && wpw >= 2) return "Buena";
  if (snapshot.workout.totalWorkouts >= 8) return "Buena";
  return "Mejorable";
}

function hasComposition(selected: ReadonlySet<ExportContentKey>): boolean {
  return (
    selected.has("weight") ||
    selected.has("bodyFat") ||
    selected.has("measurements")
  );
}

function hasTraining(selected: ReadonlySet<ExportContentKey>): boolean {
  return selected.has("workouts");
}

function hasRecovery(selected: ReadonlySet<ExportContentKey>): boolean {
  return selected.has("sleep") || selected.has("bloodPressure");
}

function hasActivity(selected: ReadonlySet<ExportContentKey>): boolean {
  return selected.has("steps");
}

function hasPrs(selected: ReadonlySet<ExportContentKey>): boolean {
  return selected.has("personalRecords");
}

function hasInsights(selected: ReadonlySet<ExportContentKey>): boolean {
  return selected.has("insights");
}

function buildComposition(
  snapshot: AnalyticsSnapshot,
  selected: ReadonlySet<ExportContentKey>,
  weightChart: number[],
): PdfReportNarrative["composition"] {
  if (!hasComposition(selected)) return null;

  const indicators: CompositionIndicator[] = [];
  const wDelta = snapshot.weight.delta("30d");
  const wTrend = snapshot.weight.trend("30d")?.direction;
  const bfDelta = snapshot.bodyFat.delta("30d");
  const waistDelta = snapshot.measurements.waist?.delta("30d");

  if (selected.has("weight") && snapshot.weight.last != null) {
    let interpretation = "Todavía hay pocas lecturas para interpretar el peso.";
    if (wDelta && Number.isFinite(wDelta.absolute)) {
      if (abs(wDelta.absolute) < 0.4 || wTrend === "flat") {
        interpretation =
          "Tu peso apenas ha cambiado: la báscula está tranquila.";
      } else if (wDelta.absolute > 0) {
        interpretation =
          "Has subido un poco de peso. Conviene mirarlo junto a cintura y grasa, no solo.";
      } else {
        interpretation =
          "Has bajado algo de peso. Si te sientes bien entrenando, es una señal útil.";
      }
    }
    indicators.push({
      name: "Peso",
      valueLine: `${fmtEs(snapshot.weight.last)} kg`,
      changeLine:
        wDelta && Number.isFinite(wDelta.absolute)
          ? `${fmtSigned(wDelta.absolute, 1, "kg")} en 30 días`
          : "Sin cambio medible en 30 días",
      interpretation,
    });
  }

  if (selected.has("bodyFat") && snapshot.bodyFat.last != null) {
    let interpretation = "Pocas lecturas de grasa para leer una tendencia.";
    if (bfDelta && Number.isFinite(bfDelta.absolute)) {
      if (abs(bfDelta.absolute) < 0.3) {
        interpretation = "La grasa corporal se mantiene casi igual.";
      } else if (bfDelta.absolute < 0) {
        interpretation =
          "Bajas grasa: buena señal si el entrenamiento se sostiene.";
      } else {
        interpretation =
          "La grasa ha subido un poco; no es alarma si el resto acompaña.";
      }
    }
    indicators.push({
      name: "Grasa corporal",
      valueLine: `${fmtEs(snapshot.bodyFat.last)} %`,
      changeLine:
        bfDelta && Number.isFinite(bfDelta.absolute)
          ? `${fmtSigned(bfDelta.absolute, 1, "%")} en 30 días`
          : "Sin cambio medible en 30 días",
      interpretation,
    });
  }

  if (selected.has("measurements") && snapshot.measurements.waist?.last != null) {
    let interpretation = "Hay poca historia de cintura todavía.";
    if (waistDelta && Number.isFinite(waistDelta.absolute)) {
      if (waistDelta.absolute <= -0.5) {
        interpretation =
          "La cintura baja: suele decir más que el peso sobre composición.";
      } else if (waistDelta.absolute >= 0.5) {
        interpretation =
          "La cintura ha subido un poco; conviene seguir midiendo con calma.";
      } else {
        interpretation = "La cintura se mantiene estable.";
      }
    }
    indicators.push({
      name: "Cintura",
      valueLine: `${fmtEs(snapshot.measurements.waist.last)} cm`,
      changeLine:
        waistDelta && Number.isFinite(waistDelta.absolute)
          ? `${fmtSigned(waistDelta.absolute, 1, "cm")} en 30 días`
          : "Sin cambio medible en 30 días",
      interpretation,
    });
  }

  if (indicators.length === 0) {
    return {
      mainMessage: "Aún no hay suficientes medidas corporales en este periodo.",
      indicators: [],
      conclusion:
        "Cuando registres peso, grasa o cintura con regularidad, aquí aparecerá la lectura de composición.",
      chartValues: [],
    };
  }

  const weightStable =
    wDelta == null ||
    !Number.isFinite(wDelta.absolute) ||
    abs(wDelta.absolute) < 0.4 ||
    wTrend === "flat";
  const waistDown =
    waistDelta != null &&
    Number.isFinite(waistDelta.absolute) &&
    waistDelta.absolute <= -0.5;
  const fatDown =
    bfDelta != null &&
    Number.isFinite(bfDelta.absolute) &&
    bfDelta.absolute <= -0.3;
  const weightUp =
    wDelta != null && Number.isFinite(wDelta.absolute) && wDelta.absolute >= 0.4;

  let conclusion =
    "La composición pide más registros coherentes para afinar el relato.";
  let mainMessage = "Tu composición corporal deja pocas señales claras todavía.";

  if (weightStable && waistDown) {
    mainMessage =
      "El peso se mantiene y la cintura baja: señal clásica de mejor composición.";
    conclusion =
      "Aunque la báscula casi no se mueva, la cintura cuenta una historia mejor. Mantén el rumbo.";
  } else if (weightUp && waistDown) {
    mainMessage =
      "Subes un poco de peso mientras la cintura baja: patrón compatible con ganar músculo.";
    conclusion =
      "No te obsesiones con el número de la báscula: la forma del cuerpo está mejorando.";
  } else if (fatDown) {
    mainMessage = "La grasa corporal baja en el periodo.";
    conclusion =
      "Si el entrenamiento se sostiene, es un buen momento para no forzar déficit agresivo.";
  } else if (weightStable) {
    mainMessage = "Tu peso apenas ha cambiado en las últimas semanas.";
    conclusion =
      "Con el peso estable, el siguiente foco útil es cintura, grasa y cómo rinde el entrenamiento.";
  } else if (wTrend === "down") {
    mainMessage = "Tu peso ha bajado de forma apreciable.";
    conclusion =
      "Comprueba que te sientes fuerte al entrenar; bajar de peso no siempre es progreso.";
  } else if (wTrend === "up") {
    mainMessage = "Tu peso ha subido un poco en el periodo.";
    conclusion =
      "Contrástalo con cintura y grasa antes de decidir si el cambio te conviene.";
  }

  return {
    mainMessage,
    indicators,
    conclusion,
    chartValues: selected.has("weight") ? weightChart : [],
  };
}

function buildTraining(
  snapshot: AnalyticsSnapshot,
  range: DateRange,
  selected: ReadonlySet<ExportContentKey>,
  data?: CollectedLiveData,
): PdfReportNarrative["training"] {
  if (!hasTraining(selected)) return null;

  const rating = trainingRating(snapshot);
  const n = snapshot.workout.totalWorkouts;
  const wpw = snapshot.workout.workoutsPerWeek;
  const prCount = countPrsInRange(snapshot, range);
  const medals = markMainLifts(prsInRange(snapshot, range), data);
  const mainPrs = medals.filter((m) => m.isMain).length;
  const accessoryPrs = medals.length - mainPrs;

  if (n === 0) {
    return {
      mainMessage:
        "En este periodo no hay sesiones de entrenamiento registradas.",
      rating: "Mejorable",
      paragraphs: [
        "Cuando vuelvas a entrenar, el informe reflejará el ritmo de verdad: frecuencia, volumen y récords.",
      ],
      conclusion:
        "El próximo paso es sencillo: registrar al menos un bloque semanal sostenible.",
    };
  }

  const freqLine =
    wpw != null
      ? `Has entrenado unas ${fmtEs(wpw, 1)} sesiones por semana`
      : `Has completado ${n} ${n === 1 ? "sesión" : "sesiones"}`;

  const paragraphs: string[] = [
    `${freqLine}, con ${Math.round(snapshot.workout.totalVolumeKg).toLocaleString("es-ES")} kg de volumen acumulado y ${snapshot.workout.totalSets} series.`,
  ];

  if (snapshot.workout.mostPerformedExercise) {
    paragraphs.push(
      `El ejercicio que más aparece es ${snapshot.workout.mostPerformedExercise.nameEs} (${snapshot.workout.mostPerformedExercise.sessionCount} sesiones).`,
    );
  }

  if (prCount > 0) {
    if (mainPrs > 0 && accessoryPrs > 0) {
      paragraphs.push(
        `Hay ${prCount} récords nuevos: ${mainPrs} en movimientos principales y ${accessoryPrs} en accesorios. Los principales suelen importar más para el progreso a largo plazo.`,
      );
    } else if (mainPrs > 0) {
      paragraphs.push(
        `Los ${prCount === 1 ? "récord llega" : "récords llegan"} sobre todo en movimientos principales: buena señal de fuerza útil.`,
      );
    } else {
      paragraphs.push(
        `Los ${prCount === 1 ? "récord aparece" : "récords aparecen"} sobre todo en accesorios. Está bien, pero conviene vigilar también las alzadas clave.`,
      );
    }
  }

  let conclusion: string;
  let mainMessage: string;
  if (rating === "Muy buena") {
    mainMessage = "La frecuencia de entrenamiento es sólida y sostenida.";
    conclusion =
      "Mantén este ritmo. Si buscas más progreso, afina calidad (cargas, RIR) antes de añadir días.";
  } else if (rating === "Buena") {
    mainMessage = "Has entrenado con regularidad suficiente para progresar.";
    conclusion =
      "Un día extra bien recuperado, o más consistencia entre semanas, suele marcar diferencia.";
  } else {
    mainMessage = "Has entrenado, pero el ritmo es irregular.";
    conclusion =
      "Busca una cadencia que puedas sostener semana a semana; la constancia gana a los picos.";
  }

  return { mainMessage, rating, paragraphs, conclusion };
}

function findSleepCorrelation(
  insights: readonly Insight[],
): string | null {
  const sleepRelated = insights.find(
    (i) =>
      i.category === "sleep" ||
      i.category === "general" ||
      /sueño|duerm|descans/i.test(`${i.title} ${i.description}`),
  );
  if (!sleepRelated) return null;
  if (
    /sueño|duerm|descans|noche/i.test(
      `${sleepRelated.title} ${sleepRelated.description}`,
    )
  ) {
    return `${sleepRelated.title}. ${sleepRelated.description}`;
  }
  return null;
}

function buildRecovery(
  snapshot: AnalyticsSnapshot,
  insights: readonly Insight[],
  selected: ReadonlySet<ExportContentKey>,
): PdfReportNarrative["recovery"] {
  if (!hasRecovery(selected)) return null;

  const paragraphs: string[] = [];
  let mainMessage = "Hay poca información de recuperación en este periodo.";
  let conclusion =
    "Registrar sueño (y tensión, si aplica) da pistas baratas para entrenar mejor.";

  if (selected.has("sleep") && snapshot.sleep.meanDurationMinutes != null) {
    const mean = snapshot.sleep.meanDurationMinutes;
    const meanLabel = formatDurationHm(mean);
    mainMessage = `Duermes de media ${meanLabel} por noche.`;

    if (mean < 390) {
      paragraphs.push(
        `Eso se queda corto para recuperar bien. Priorizar descanso puede ser el atajo más barato para entrenar mejor.`,
      );
      conclusion =
        "El cuello de botella más claro parece el sueño: alárgalo antes de forzar más volumen.";
    } else if (mean >= 420) {
      paragraphs.push(
        `El descanso nocturno acompaña bien al entrenamiento. Mantén esa base si puedes.`,
      );
      conclusion =
        "Con el sueño en buen rango, el siguiente foco suele ser la calidad del entrenamiento.";
    } else {
      paragraphs.push(
        `Estás en un rango aceptable, pero cerca del límite. Un poco más de sueño suele notarse en el gym.`,
      );
      conclusion =
        "Empuja el sueño hacia 7 h o más en las noches previas a entrenos duros.";
    }

    if (snapshot.sleep.meanScore != null) {
      paragraphs.push(
        `La puntuación media de sueño es ${fmtEs(snapshot.sleep.meanScore, 0)}.`,
      );
    }
    if (snapshot.sleep.bestNight) {
      paragraphs.push(
        `Tu mejor noche: ${formatDurationHm(snapshot.sleep.bestNight.durationMinutes)} (${snapshot.sleep.bestNight.entryDate}).`,
      );
    }
  } else if (selected.has("sleep")) {
    paragraphs.push("No hay noches de sueño registradas en el periodo.");
  }

  if (
    selected.has("bloodPressure") &&
    snapshot.bloodPressure.meanSystolic != null
  ) {
    paragraphs.push(
      `Tensión media: ${Math.round(snapshot.bloodPressure.meanSystolic)}/${Math.round(snapshot.bloodPressure.meanDiastolic ?? 0)}.`,
    );
  }

  const correlation = findSleepCorrelation(insights);

  return {
    mainMessage,
    paragraphs,
    correlation,
    conclusion,
  };
}

function buildActivity(
  snapshot: AnalyticsSnapshot,
  selected: ReadonlySet<ExportContentKey>,
): PdfReportNarrative["activity"] {
  if (!hasActivity(selected)) return null;

  if (snapshot.steps.dayCount === 0) {
    return {
      mainMessage: "No hay días con pasos registrados en este periodo.",
      paragraphs: [],
      conclusion:
        "Cuando registres actividad diaria, aquí verás adherencia al objetivo y el relato del movimiento.",
    };
  }

  const avg = snapshot.steps.average("30d") ?? snapshot.steps.dailyMean;
  const ratio = snapshot.steps.goalMetRatio;
  const adherencePct =
    ratio != null ? Math.round(ratio * 100) : null;

  const paragraphs: string[] = [];
  if (avg != null) {
    paragraphs.push(
      `Media diaria: ${Math.round(avg).toLocaleString("es-ES")} pasos (objetivo ${snapshot.steps.goal.toLocaleString("es-ES")}).`,
    );
  }
  if (adherencePct != null) {
    paragraphs.push(
      `Has cumplido el objetivo de pasos el ${adherencePct} % de los días registrados.`,
    );
  }
  if (snapshot.steps.bestGoalStreak > 1) {
    paragraphs.push(
      `Tu mejor racha cumpliendo el objetivo: ${snapshot.steps.bestGoalStreak} días.`,
    );
  }

  let mainMessage: string;
  let conclusion: string;
  if (adherencePct != null && adherencePct >= 70) {
    mainMessage = "La adherencia al objetivo de pasos es alta.";
    conclusion =
      "El movimiento diario sostiene la recuperación y el gasto. Mantén el hábito.";
  } else if (adherencePct != null && adherencePct >= 40) {
    mainMessage = "Cumples el objetivo de pasos en bastantes días, pero no de forma estable.";
    conclusion =
      "Subir un poco la adherencia (sin obsesionarte) suele ayudar más que un pico aislado.";
  } else if (adherencePct != null) {
    mainMessage = "La adherencia al objetivo de pasos es baja.";
    conclusion =
      "No hace falta machacarte: más días por encima del mínimo suelen bastar.";
  } else {
    mainMessage = "Hay actividad registrada, pero poca para juzgar adherencia.";
    conclusion = "Sigue registrando días completos para leer el patrón con claridad.";
  }

  return { mainMessage, paragraphs, conclusion };
}

function buildPersonalRecords(
  snapshot: AnalyticsSnapshot,
  range: DateRange,
  selected: ReadonlySet<ExportContentKey>,
  data?: CollectedLiveData,
): PdfReportNarrative["personalRecords"] {
  if (!hasPrs(selected)) return null;

  const medalsRaw = markMainLifts(prsInRange(snapshot, range), data).slice(
    0,
    5,
  );

  if (medalsRaw.length === 0) {
    return {
      mainMessage: "En este periodo no hay récords personales nuevos.",
      medals: [],
      conclusion:
        "Los PR llegarán cuando la constancia y la recuperación empujen las cargas clave.",
    };
  }

  const medals: PrMedal[] = medalsRaw.map((m) => {
    const tag = m.isMain ? "Principal" : "Accesorio";
    let detail = kindLabelEs(m.kind);
    if (m.kind === "max_load" && m.load != null) {
      detail = `${fmtEs(m.load)} kg · ${kindLabelEs(m.kind)} · ${m.sessionDate}`;
    } else if (m.kind === "max_reps" && m.repetitions != null) {
      detail = `${m.repetitions} reps · ${m.sessionDate}`;
    } else {
      detail = `${Math.round(m.volumeKg)} kg de volumen · ${m.sessionDate}`;
    }
    return {
      headline: `${tag}: ${m.nameEs}`,
      detail,
    };
  });

  const n = medalsRaw.length;
  return {
    mainMessage:
      n === 1
        ? "Hay un logro que merece destaque."
        : `Hay ${n} logros que merecen destaque.`,
    medals,
    conclusion:
      "Celebra lo ganado y pregunta qué movimiento principal puedes empujar a continuación.",
  };
}

function buildDiscoveries(
  insights: readonly Insight[],
  selected: ReadonlySet<ExportContentKey>,
): PdfReportNarrative["discoveries"] {
  if (!hasInsights(selected)) return null;

  // Prefer knowledge (correlation / recommendation / warning) over bare achievements.
  const ranked = [...insights].sort((a, b) => {
    const score = (i: Insight) => {
      if (i.type === "correlation") return 0;
      if (i.type === "recommendation") return 1;
      if (i.type === "warning") return 2;
      if (i.type === "trend") return 3;
      return 4;
    };
    return score(a) - score(b);
  });

  const cards: DiscoveryCard[] = ranked.slice(0, 3).map((i) => ({
    title: i.title,
    body: i.action ? `${i.description} ${i.action}` : i.description,
  }));

  if (cards.length === 0) {
    return {
      cards: [
        {
          title: "Sin descubrimientos nuevos",
          body: "Cuando los datos crucen dominios con más fuerza, aquí aparecerán lecturas que no se ven en un gráfico suelto.",
        },
      ],
    };
  }

  return { cards };
}

function buildFinalConclusion(
  snapshot: AnalyticsSnapshot,
  range: DateRange,
  parts: {
    composition: PdfReportNarrative["composition"];
    training: PdfReportNarrative["training"];
    recovery: PdfReportNarrative["recovery"];
    activity: PdfReportNarrative["activity"];
  },
): string[] {
  const out: string[] = [];

  // Constancy
  if (parts.training) {
    if (parts.training.rating === "Muy buena") {
      out.push(
        "La constancia en el entrenamiento es uno de los puntos fuertes de este periodo.",
      );
    } else if (parts.training.rating === "Buena") {
      out.push(
        "Hay una base de entrenamiento razonable; el siguiente salto está en sostenerla cada semana.",
      );
    } else if (snapshot.workout.totalWorkouts === 0) {
      out.push(
        "Sin sesiones registradas, el informe no puede hablar de ritmo de entrenamiento todavía.",
      );
    } else {
      out.push(
        "El cuello de botella del entrenamiento parece la irregularidad: primero cadencia, luego intensidad.",
      );
    }
  }

  // Composition
  if (parts.composition?.conclusion) {
    out.push(parts.composition.conclusion);
  }

  // Bottleneck — prefer sleep
  if (
    parts.recovery &&
    snapshot.sleep.meanDurationMinutes != null &&
    snapshot.sleep.meanDurationMinutes < 390
  ) {
    out.push(
      `El sueño medio (${formatDurationHm(snapshot.sleep.meanDurationMinutes)}) parece el freno más barato de quitar antes de pedir más al cuerpo.`,
    );
  } else if (parts.activity && snapshot.steps.goalMetRatio != null && snapshot.steps.goalMetRatio < 0.4) {
    out.push(
      "La actividad diaria está floja: más días cumpliendo el objetivo de pasos ayudarían sin añadir estrés de gym.",
    );
  }

  // Next focus
  const prCount = countPrsInRange(snapshot, range);
  if (
    parts.recovery &&
    snapshot.sleep.meanDurationMinutes != null &&
    snapshot.sleep.meanDurationMinutes < 390
  ) {
    out.push(
      "Próximo foco: alargar el sueño en las noches previas a los entrenos duros.",
    );
  } else if (parts.training && parts.training.rating === "Mejorable") {
    out.push(
      "Próximo foco: una cadencia de entrenamiento que puedas cumplir sin fallar semanas.",
    );
  } else if (prCount > 0 && parts.training) {
    out.push(
      "Próximo foco: consolidar los récords en movimientos principales y no dispersar el esfuerzo.",
    );
  } else if (parts.composition) {
    out.push(
      "Próximo foco: seguir midiendo composición (peso, cintura, grasa) con la misma calma con la que entrenas.",
    );
  } else {
    out.push(
      "Próximo foco: seguir registrando con constancia; el informe gana valor con cada semana de datos.",
    );
  }

  // Deduplicate near-identical lines
  const unique: string[] = [];
  for (const line of out) {
    if (!unique.some((u) => u === line)) unique.push(line);
  }
  return unique.slice(0, 5);
}

function buildExecutiveMessages(
  snapshot: AnalyticsSnapshot,
  range: DateRange,
  parts: {
    composition: PdfReportNarrative["composition"];
    training: PdfReportNarrative["training"];
    recovery: PdfReportNarrative["recovery"];
    activity: PdfReportNarrative["activity"];
    personalRecords: PdfReportNarrative["personalRecords"];
  },
): NarrativeLabeledMessage[] {
  const messages: NarrativeLabeledMessage[] = [];

  // Lo mejor del periodo
  const prCount = countPrsInRange(snapshot, range);
  const bestBits: string[] = [];
  if (prCount > 0) {
    bestBits.push(
      prCount === 1
        ? "1 récord personal nuevo"
        : `${prCount} récords personales nuevos`,
    );
  }
  if (parts.training && parts.training.rating === "Muy buena") {
    bestBits.push("frecuencia de entrenamiento muy sólida");
  } else if (snapshot.workout.totalWorkouts > 0) {
    bestBits.push(
      `${snapshot.workout.totalWorkouts} ${snapshot.workout.totalWorkouts === 1 ? "entrenamiento" : "entrenamientos"}`,
    );
  }
  if (
    parts.composition &&
    /cintura baja|mejor composición|grasa corporal baja/i.test(
      parts.composition.mainMessage,
    )
  ) {
    bestBits.push("mejora de composición corporal");
  }
  if (bestBits.length > 0) {
    messages.push({
      label: "Lo mejor del periodo",
      text: `Destaca ${bestBits.join("; ")}.`,
    });
  } else {
    messages.push({
      label: "Lo mejor del periodo",
      text: "Todavía hay pocos logros claros; el valor está en seguir dejando huella.",
    });
  }

  if (parts.composition) {
    messages.push({
      label: "Composición corporal",
      text: parts.composition.mainMessage,
    });
  }

  if (parts.recovery) {
    messages.push({
      label: "Recuperación",
      text: parts.recovery.mainMessage,
    });
  }

  if (parts.training) {
    messages.push({
      label: "Rendimiento",
      text: `${parts.training.mainMessage} Valoración: ${parts.training.rating}.`,
    });
  }

  // Próximo foco — last message
  const focus =
    parts.recovery &&
    snapshot.sleep.meanDurationMinutes != null &&
    snapshot.sleep.meanDurationMinutes < 390
      ? "Prioriza alargar el sueño antes de subir volumen."
      : parts.training && parts.training.rating === "Mejorable"
        ? "Busca una cadencia de entrenamiento sostenible semana a semana."
        : parts.composition &&
            /báscula|peso|cintura|grasa/i.test(parts.composition.conclusion)
          ? parts.composition.conclusion
          : "Sigue registrando con constancia y protege lo que ya funciona.";

  messages.push({
    label: "Próximo foco",
    text: focus,
  });

  return messages.slice(0, 5);
}

function buildCoachAppendix(
  data: CollectedLiveData,
  selected: ReadonlySet<ExportContentKey>,
  range: DateRange,
  snapshot: AnalyticsSnapshot,
): PdfReportNarrative["coachAppendix"] {
  const tables: CoachTable[] = [];
  const names = exerciseNameMap(data.exercises);

  if (selected.has("workouts") && data.workoutSessions.length > 0) {
    tables.push({
      title: "Sesiones",
      headers: ["Fecha", "Estado", "Min", "Ejercicios", "Series"],
      rows: data.workoutSessions.slice(0, 40).map((s) => [
        s.sessionDate,
        s.status,
        s.durationMinutes != null ? String(Math.round(s.durationMinutes)) : "—",
        String(s.exercises.length),
        String(s.exercises.reduce((n, ex) => n + ex.sets.length, 0)),
      ]),
    });
  }

  if (selected.has("sets")) {
    const rows: string[][] = [];
    for (const session of data.workoutSessions) {
      for (const exercise of session.exercises) {
        const exerciseName =
          names.get(exercise.exerciseId) ?? exercise.exerciseId;
        for (const set of exercise.sets) {
          rows.push([
            session.sessionDate,
            exerciseName,
            String(set.setNumber),
            set.load != null ? fmtEs(set.load) : "—",
            set.repetitions != null ? String(set.repetitions) : "—",
            set.rir != null ? String(set.rir) : "—",
            String(Math.round(set.load != null && set.repetitions != null
              ? set.load * set.repetitions
              : 0)),
          ]);
          if (rows.length >= 80) break;
        }
        if (rows.length >= 80) break;
      }
      if (rows.length >= 80) break;
    }
    if (rows.length > 0) {
      tables.push({
        title: "Series (carga, reps, RIR, volumen)",
        headers: ["Fecha", "Ejercicio", "Serie", "kg", "Reps", "RIR", "Vol"],
        rows,
      });
    }
  }

  if (selected.has("personalRecords")) {
    const medals = prsInRange(snapshot, range);
    if (medals.length > 0) {
      tables.push({
        title: "Récords personales del periodo",
        headers: ["Ejercicio", "Tipo", "Carga", "Reps", "Vol", "Fecha"],
        rows: medals.slice(0, 40).map((m) => [
          m.nameEs,
          kindLabelEs(m.kind),
          m.load != null ? fmtEs(m.load) : "—",
          m.repetitions != null ? String(m.repetitions) : "—",
          String(Math.round(m.volumeKg)),
          m.sessionDate,
        ]),
      });
    }
  }

  if (selected.has("analytics")) {
    tables.push({
      title: "Resumen analítico (derivado)",
      headers: ["Métrica", "Valor"],
      rows: [
        ["Sesiones", String(snapshot.workout.totalWorkouts)],
        [
          "Sesiones / semana",
          snapshot.workout.workoutsPerWeek != null
            ? fmtEs(snapshot.workout.workoutsPerWeek)
            : "—",
        ],
        ["Volumen total (kg)", String(Math.round(snapshot.workout.totalVolumeKg))],
        ["Series", String(snapshot.workout.totalSets)],
        [
          "Sueño medio",
          snapshot.sleep.meanDurationMinutes != null
            ? formatDurationHm(snapshot.sleep.meanDurationMinutes)
            : "—",
        ],
        [
          "Adherencia pasos",
          snapshot.steps.goalMetRatio != null
            ? `${Math.round(snapshot.steps.goalMetRatio * 100)} %`
            : "—",
        ],
        [
          "Peso último",
          snapshot.weight.last != null ? `${fmtEs(snapshot.weight.last)} kg` : "—",
        ],
      ],
    });
  }

  if (tables.length === 0) return null;
  return { tables };
}

/**
 * Build the full PDF narrative from Analytics + Insights (read-only).
 */
export function buildPdfNarrative(input: {
  snapshot: AnalyticsSnapshot;
  insights: readonly Insight[];
  range: DateRange;
  selected: ReadonlySet<ExportContentKey>;
  detail: PdfDetailLevel;
  data?: CollectedLiveData;
  weightChartValues?: number[];
}): PdfReportNarrative {
  const {
    snapshot,
    insights,
    range,
    selected,
    detail,
    data,
    weightChartValues = [],
  } = input;

  const composition = buildComposition(snapshot, selected, weightChartValues);
  const training = buildTraining(snapshot, range, selected, data);
  const recovery = buildRecovery(snapshot, insights, selected);
  const activity = buildActivity(snapshot, selected);
  const personalRecords = buildPersonalRecords(
    snapshot,
    range,
    selected,
    data,
  );
  const discoveries = buildDiscoveries(insights, selected);

  const executiveMessages = buildExecutiveMessages(snapshot, range, {
    composition,
    training,
    recovery,
    activity,
    personalRecords,
  });

  const finalConclusion = {
    paragraphs: buildFinalConclusion(snapshot, range, {
      composition,
      training,
      recovery,
      activity,
    }),
  };

  const coachAppendix =
    detail === "coach" && data
      ? buildCoachAppendix(data, selected, range, snapshot)
      : null;

  return {
    coverTagline: pickTagline(
      `${range.startDate}:${range.endDate}:${snapshot.asOfDate}`,
    ),
    detailLabel: PDF_DETAIL_COPY_ES[detail].title,
    executiveMessages,
    composition: detail === "summary" ? null : composition,
    training: detail === "summary" ? null : training,
    recovery: detail === "summary" ? null : recovery,
    activity: detail === "summary" ? null : activity,
    personalRecords: detail === "summary" ? null : personalRecords,
    discoveries: detail === "summary" ? null : discoveries,
    finalConclusion,
    coachAppendix,
  };
}

/** @deprecated Prefer buildPdfNarrative — kept for tests / callers. */
export function buildHighlights(
  snapshot: AnalyticsSnapshot,
  range: DateRange,
): string[] {
  const narrative = buildPdfNarrative({
    snapshot,
    insights: [],
    range,
    selected: new Set([
      "weight",
      "bodyFat",
      "measurements",
      "workouts",
      "personalRecords",
      "sleep",
      "steps",
      "insights",
    ] as ExportContentKey[]),
    detail: "summary",
  });
  return narrative.executiveMessages.map((m) => `${m.label}: ${m.text}`);
}

/** @deprecated Prefer buildPdfNarrative — kept for tests / callers. */
export function buildNaturalConclusions(
  snapshot: AnalyticsSnapshot,
  insightCount: number,
): string[] {
  void insightCount;
  const narrative = buildPdfNarrative({
    snapshot,
    insights: [],
    range: { startDate: "1970-01-01", endDate: snapshot.asOfDate },
    selected: new Set([
      "weight",
      "bodyFat",
      "measurements",
      "workouts",
      "personalRecords",
      "sleep",
      "steps",
      "insights",
    ] as ExportContentKey[]),
    detail: "summary",
  });
  return narrative.finalConclusion.paragraphs;
}

/** @deprecated Prefer buildPdfNarrative. */
export function buildExecutiveParagraphs(
  snapshot: AnalyticsSnapshot,
  workoutCount: number,
  weightCount: number,
): string[] {
  void workoutCount;
  void weightCount;
  const narrative = buildPdfNarrative({
    snapshot,
    insights: [],
    range: { startDate: "1970-01-01", endDate: snapshot.asOfDate },
    selected: new Set([
      "weight",
      "bodyFat",
      "measurements",
      "workouts",
      "sleep",
      "steps",
    ] as ExportContentKey[]),
    detail: "summary",
  });
  return narrative.executiveMessages.map((m) => m.text);
}
