import { createId } from "@/lib/storage/localStorage";
import type { ExerciseCatalogItem } from "@/features/workout/WorkoutTypes";
import { inferBodyZone } from "./exerciseCatalogs";
import { ExerciseRepository } from "./exerciseRepository";
import {
  canDeleteExercise,
  getExerciseReferences,
} from "./exerciseReferences";
import { toCatalogItem } from "./exerciseMapping";
import { LOAD_INCREMENTS } from "./exerciseTypes";
import type {
  Exercise,
  ExerciseFieldErrors,
  ExerciseFilters,
  ExerciseInput,
  ExerciseReferenceSummary,
  ExerciseValidationResult,
  RecordingType,
  StructuralChangeWarning,
} from "./exerciseTypes";

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function ensureUniqueSlug(base: string, excludeId?: string): string {
  const root = base || "ejercicio";
  let candidate = root;
  let n = 2;
  while (true) {
    const hit = ExerciseRepository.getBySlug(candidate);
    if (!hit || hit.id === excludeId) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}

/** Propose "{name} (copia)" / "{name} (copia 2)" until unique among nameEs. */
function uniqueCopyName(name: string): string {
  const root = name.trim() || "Ejercicio";
  const base = `${root} (copia)`;
  const existing = new Set(
    ExerciseRepository.getAll().map((item) => item.nameEs.toLowerCase()),
  );
  if (!existing.has(base.toLowerCase())) return base;
  let n = 2;
  while (existing.has(`${root} (copia ${n})`.toLowerCase())) {
    n += 1;
  }
  return `${root} (copia ${n})`;
}

function defaultLoadType(type: RecordingType): Exercise["loadType"] {
  switch (type) {
    case "strength":
      return "Total Weight";
    case "bodyweight":
    case "timed":
      return "Bodyweight";
    case "cardio":
      return "N/A";
  }
}

export const ExerciseService = {
  defaultsForCreate(recordingType: RecordingType = "strength"): ExerciseInput {
    return {
      name: "",
      nameEs: "",
      recordingType,
      primaryMuscle: "Chest",
      secondaryMuscles: [],
      movementPattern: recordingType === "cardio" ? "Cardio" : "Push",
      equipment: recordingType === "bodyweight" ? "Bodyweight" : "Machine",
      loadType: defaultLoadType(recordingType),
      bodyZone: inferBodyZone("Chest"),
      defaults: {
        sets: recordingType === "cardio" || recordingType === "timed" ? 1 : 3,
        repMin:
          recordingType === "timed" || recordingType === "cardio" ? null : 8,
        repMax:
          recordingType === "timed" || recordingType === "cardio" ? null : 12,
        targetRir:
          recordingType === "timed" || recordingType === "cardio" ? null : 2,
        restSeconds:
          recordingType === "timed" || recordingType === "cardio" ? 0 : 90,
        loadIncrement: recordingType === "strength" ? 2.5 : 1,
        initialLoad: recordingType === "strength" ? 20 : null,
        loadUnit: "kg",
      },
      imagePath: null,
      techniqueTip: null,
      setupNote: null,
      isBilateral: true,
    };
  },

  validate(
    raw: {
      name: string;
      slug?: string;
      recordingType: string;
      primaryMuscle: string;
      sets: string;
      repMin: string;
      repMax: string;
      targetRir: string;
      restSeconds: string;
      loadIncrement: string;
      initialLoad: string;
      secondaryMuscles?: string[];
      movementPattern?: string | null;
      equipment?: string | null;
      loadType?: Exercise["loadType"];
      bodyZone?: string | null;
      imagePath?: string | null;
      techniqueTip?: string | null;
      setupNote?: string | null;
      isBilateral?: boolean;
      nameEs?: string;
    },
    options?: { excludeId?: string },
  ): ExerciseValidationResult {
    const errors: ExerciseFieldErrors = {};

    const name = raw.name.trim();
    if (!name) {
      errors.name = "El nombre es obligatorio";
    } else if (name.length < 2) {
      errors.name = "Usa al menos 2 caracteres";
    } else if (name.length > 80) {
      errors.name = "Máximo 80 caracteres";
    }

    const recordingType = raw.recordingType as RecordingType;
    if (
      recordingType !== "strength" &&
      recordingType !== "bodyweight" &&
      recordingType !== "timed" &&
      recordingType !== "cardio"
    ) {
      errors.recordingType = "Tipo de registro no válido";
    }

    if (!raw.primaryMuscle.trim()) {
      errors.primaryMuscle = "El músculo principal es obligatorio";
    }

    const sets = Number(raw.sets);
    if (!Number.isFinite(sets) || !Number.isInteger(sets) || sets < 1) {
      errors.sets = "Las series deben ser un entero ≥ 1";
    } else if (sets > 20) {
      errors.sets = "Máximo 20 series";
    }

    let repMin: number | null = null;
    let repMax: number | null = null;
    const needsReps =
      recordingType === "strength" || recordingType === "bodyweight";

    if (needsReps) {
      if (raw.repMin.trim() === "") {
        errors.repMin = "Reps mínimas obligatorias";
      } else {
        const parsed = Number(raw.repMin);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
          errors.repMin = "Entero ≥ 1";
        } else {
          repMin = parsed;
        }
      }
      if (raw.repMax.trim() === "") {
        errors.repMax = "Reps máximas obligatorias";
      } else {
        const parsed = Number(raw.repMax);
        if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
          errors.repMax = "Entero ≥ 1";
        } else {
          repMax = parsed;
        }
      }
      if (repMin != null && repMax != null && repMax < repMin) {
        errors.repMax = "Máx debe ser ≥ mín";
      }
    }

    let targetRir: number | null = null;
    if (needsReps && raw.targetRir.trim() !== "") {
      const parsed = Number(raw.targetRir);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
        errors.targetRir = "RIR entre 0 y 10";
      } else {
        targetRir = parsed;
      }
    }

    const restSeconds = Number(raw.restSeconds);
    if (!Number.isFinite(restSeconds) || restSeconds < 0) {
      errors.restSeconds = "El descanso debe ser ≥ 0";
    } else if (restSeconds > 600) {
      errors.restSeconds = "Máximo 600 s";
    }

    const loadIncrement = Number(raw.loadIncrement);
    if (
      !Number.isFinite(loadIncrement) ||
      loadIncrement <= 0 ||
      !(LOAD_INCREMENTS as readonly number[]).includes(loadIncrement)
    ) {
      errors.loadIncrement = "Incremento no válido";
    }

    let initialLoad: number | null = null;
    if (recordingType === "strength") {
      if (raw.initialLoad.trim() !== "") {
        const parsed = Number(raw.initialLoad.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) {
          errors.initialLoad = "Carga no válida";
        } else {
          initialLoad = parsed;
        }
      }
    }

    let slug: string | undefined;
    if (raw.slug != null && raw.slug.trim()) {
      const candidate = slugify(raw.slug);
      if (!candidate) {
        errors.slug = "Slug no válido";
      } else {
        const clash = ExerciseRepository.getBySlug(candidate);
        if (clash && clash.id !== options?.excludeId) {
          errors.slug = "Este slug ya existe";
        } else {
          slug = candidate;
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    return {
      ok: true,
      value: {
        name,
        nameEs: (raw.nameEs ?? name).trim() || name,
        recordingType,
        primaryMuscle: raw.primaryMuscle.trim(),
        secondaryMuscles: raw.secondaryMuscles ?? [],
        movementPattern: raw.movementPattern ?? null,
        equipment: raw.equipment ?? null,
        loadType: raw.loadType ?? defaultLoadType(recordingType),
        bodyZone: raw.bodyZone ?? inferBodyZone(raw.primaryMuscle),
        defaults: {
          sets,
          repMin,
          repMax,
          targetRir,
          restSeconds,
          loadIncrement: loadIncrement as Exercise["defaults"]["loadIncrement"],
          initialLoad,
          loadUnit: "kg",
        },
        imagePath: raw.imagePath ?? null,
        techniqueTip: raw.techniqueTip ?? null,
        setupNote: raw.setupNote ?? null,
        isBilateral: raw.isBilateral ?? true,
        slug,
      },
    };
  },

  getAll(): Exercise[] {
    return ExerciseRepository.getAll();
  },

  getActive(): Exercise[] {
    return ExerciseRepository.getActive();
  },

  getArchived(): Exercise[] {
    return ExerciseRepository.getArchived();
  },

  getById(id: string): Exercise | null {
    return ExerciseRepository.getById(id);
  },

  getBySlug(slug: string): Exercise | null {
    return ExerciseRepository.getBySlug(slug);
  },

  /** Catalog adapter for workout/analytics — resolves by slug (historical key). */
  getCatalogItem(slug: string): ExerciseCatalogItem | null {
    const exercise = ExerciseRepository.getBySlug(slug);
    return exercise ? toCatalogItem(exercise) : null;
  },

  listCatalogItems(options?: { activeOnly?: boolean }): ExerciseCatalogItem[] {
    const list = options?.activeOnly
      ? ExerciseRepository.getActive()
      : ExerciseRepository.getAll();
    return list.map(toCatalogItem);
  },

  search(filters: ExerciseFilters = {}): Exercise[] {
    const query = (filters.query ?? "").trim().toLowerCase();
    const status = filters.status ?? "all";
    const recordingType = filters.recordingType ?? "all";
    const primaryMuscle = filters.primaryMuscle ?? "all";

    return ExerciseRepository.getAll()
      .filter((item) => {
        if (status !== "all" && item.status !== status) return false;
        if (recordingType !== "all" && item.recordingType !== recordingType) {
          return false;
        }
        if (primaryMuscle !== "all" && item.primaryMuscle !== primaryMuscle) {
          return false;
        }
        if (!query) return true;
        const haystack = [
          item.name,
          item.nameEs,
          item.slug,
          item.primaryMuscle,
          item.equipment ?? "",
          item.recordingType,
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) =>
        a.nameEs.localeCompare(b.nameEs, "es", { sensitivity: "base" }),
      );
  },

  create(input: ExerciseInput): Exercise {
    const now = new Date().toISOString();
    const baseSlug = input.slug?.trim()
      ? slugify(input.slug)
      : slugify(input.name);
    const slug = ensureUniqueSlug(baseSlug);
    return ExerciseRepository.create({
      id: createId(),
      slug,
      name: input.name,
      nameEs: input.nameEs?.trim() || input.name,
      status: "active",
      recordingType: input.recordingType,
      primaryMuscle: input.primaryMuscle,
      secondaryMuscles: input.secondaryMuscles ?? [],
      movementPattern: input.movementPattern ?? null,
      equipment: input.equipment ?? null,
      loadType: input.loadType ?? defaultLoadType(input.recordingType),
      bodyZone: input.bodyZone ?? inferBodyZone(input.primaryMuscle),
      defaults: input.defaults,
      imagePath: input.imagePath ?? null,
      techniqueTip: input.techniqueTip ?? null,
      setupNote: input.setupNote ?? null,
      isBilateral: input.isBilateral ?? true,
      isSeed: false,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(id: string, input: ExerciseInput): Exercise | null {
    const current = ExerciseRepository.getById(id);
    if (!current) return null;

    // Slug is immutable once created — preserve historical key.
    return ExerciseRepository.update(id, {
      name: input.name,
      nameEs: input.nameEs?.trim() || input.name,
      recordingType: input.recordingType,
      primaryMuscle: input.primaryMuscle,
      secondaryMuscles: input.secondaryMuscles ?? [],
      movementPattern: input.movementPattern ?? null,
      equipment: input.equipment ?? null,
      loadType: input.loadType ?? current.loadType,
      bodyZone: input.bodyZone ?? inferBodyZone(input.primaryMuscle),
      defaults: input.defaults,
      imagePath: input.imagePath ?? null,
      techniqueTip: input.techniqueTip ?? null,
      setupNote: input.setupNote ?? null,
      isBilateral: input.isBilateral ?? true,
      updatedAt: new Date().toISOString(),
    });
  },

  archive(id: string): Exercise | null {
    return ExerciseRepository.update(id, {
      status: "archived",
      updatedAt: new Date().toISOString(),
    });
  },

  restore(id: string): Exercise | null {
    return ExerciseRepository.update(id, {
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  },

  /**
   * Duplicate into a new personal (non-seed) active exercise.
   * Copies classification, defaults, image, notes, and recording type.
   * Proposes "{name} (copia)" with a unique slug.
   */
  duplicate(id: string): Exercise | null {
    const source = ExerciseRepository.getById(id);
    if (!source) return null;

    const copyName = uniqueCopyName(source.nameEs || source.name);
    return this.create({
      name: copyName,
      nameEs: copyName,
      recordingType: source.recordingType,
      primaryMuscle: source.primaryMuscle,
      secondaryMuscles: [...source.secondaryMuscles],
      movementPattern: source.movementPattern,
      equipment: source.equipment,
      loadType: source.loadType,
      bodyZone: source.bodyZone,
      defaults: { ...source.defaults },
      imagePath: source.imagePath,
      techniqueTip: source.techniqueTip,
      setupNote: source.setupNote,
      isBilateral: source.isBilateral,
    });
  },

  canDelete(id: string): boolean {
    const exercise = ExerciseRepository.getById(id);
    if (!exercise) return false;
    return canDeleteExercise(exercise.slug);
  },

  getReferences(id: string): ExerciseReferenceSummary | null {
    const exercise = ExerciseRepository.getById(id);
    if (!exercise) return null;
    return getExerciseReferences(exercise.slug);
  },

  /**
   * Hard-delete only when never referenced.
   * Returns false if blocked (caller should archive instead).
   */
  delete(id: string): boolean {
    const exercise = ExerciseRepository.getById(id);
    if (!exercise) return false;
    if (!canDeleteExercise(exercise.slug)) return false;
    return ExerciseRepository.remove(id);
  },

  /**
   * Structural recording-type change with history → warn.
   * Full exercise versioning deferred; caller may still apply with confirm.
   */
  assessStructuralChange(
    id: string,
    nextType: RecordingType,
  ): StructuralChangeWarning | null {
    const exercise = ExerciseRepository.getById(id);
    if (!exercise || exercise.recordingType === nextType) return null;

    const refs = getExerciseReferences(exercise.slug);
    const hasHistory =
      refs.usedInWorkoutSessions > 0 ||
      refs.workoutSets > 0 ||
      refs.personalRecords > 0;

    if (!hasHistory) return null;

    return {
      hasHistory: true,
      fromType: exercise.recordingType,
      toType: nextType,
      message:
        "Este ejercicio ya tiene historial. Cambiar el tipo de registro puede hacer que sesiones antiguas se interpreten distinto. El historial no se borra; considera archivar y crear una definición nueva si el cambio es estructural.",
    };
  },
};
