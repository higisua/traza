import { storageKey } from "@/lib/storage/localStorage";
import { createLocalRepository } from "@/lib/modules/createLocalRepository";
import { buildSeedExercises } from "./exerciseSeed";
import type { Exercise, ExerciseStatus, RecordingType } from "./exerciseTypes";

function compareByName(a: Exercise, b: Exercise): number {
  return a.nameEs.localeCompare(b.nameEs, "es", { sensitivity: "base" });
}

function normalizeExercise(
  raw: Partial<Exercise> & { id: string },
): Exercise | null {
  if (typeof raw.slug !== "string" || !raw.slug.trim()) return null;
  if (typeof raw.name !== "string" || !raw.name.trim()) return null;

  const recordingType = (
    raw.recordingType === "strength" ||
    raw.recordingType === "bodyweight" ||
    raw.recordingType === "timed" ||
    raw.recordingType === "cardio"
      ? raw.recordingType
      : "strength"
  ) as RecordingType;

  const status: ExerciseStatus =
    raw.status === "archived" ? "archived" : "active";

  const defaults = raw.defaults;
  if (!defaults || typeof defaults.sets !== "number") return null;

  const now = new Date().toISOString();

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    nameEs:
      typeof raw.nameEs === "string" && raw.nameEs.trim()
        ? raw.nameEs
        : raw.name,
    status,
    recordingType,
    primaryMuscle:
      typeof raw.primaryMuscle === "string" ? raw.primaryMuscle : "Other",
    secondaryMuscles: Array.isArray(raw.secondaryMuscles)
      ? raw.secondaryMuscles.filter((m): m is string => typeof m === "string")
      : [],
    movementPattern:
      typeof raw.movementPattern === "string" ? raw.movementPattern : null,
    equipment: typeof raw.equipment === "string" ? raw.equipment : null,
    loadType:
      raw.loadType === "Total Weight" ||
      raw.loadType === "Per Dumbbell" ||
      raw.loadType === "Per Side" ||
      raw.loadType === "Bodyweight" ||
      raw.loadType === "N/A" ||
      raw.loadType === "Assistance"
        ? raw.loadType
        : "Total Weight",
    bodyZone: typeof raw.bodyZone === "string" ? raw.bodyZone : null,
    defaults: {
      sets: defaults.sets,
      repMin:
        typeof defaults.repMin === "number" && Number.isFinite(defaults.repMin)
          ? defaults.repMin
          : null,
      repMax:
        typeof defaults.repMax === "number" && Number.isFinite(defaults.repMax)
          ? defaults.repMax
          : null,
      targetRir:
        typeof defaults.targetRir === "number" &&
        Number.isFinite(defaults.targetRir)
          ? defaults.targetRir
          : null,
      restSeconds:
        typeof defaults.restSeconds === "number" &&
        Number.isFinite(defaults.restSeconds)
          ? defaults.restSeconds
          : 90,
      loadIncrement:
        typeof defaults.loadIncrement === "number" &&
        Number.isFinite(defaults.loadIncrement)
          ? (defaults.loadIncrement as Exercise["defaults"]["loadIncrement"])
          : 2.5,
      initialLoad:
        typeof defaults.initialLoad === "number" &&
        Number.isFinite(defaults.initialLoad)
          ? defaults.initialLoad
          : null,
      loadUnit: defaults.loadUnit === "lb" ? "lb" : "kg",
    },
    imagePath: typeof raw.imagePath === "string" ? raw.imagePath : null,
    techniqueTip: typeof raw.techniqueTip === "string" ? raw.techniqueTip : null,
    setupNote: typeof raw.setupNote === "string" ? raw.setupNote : null,
    isBilateral: raw.isBilateral !== false,
    isSeed: raw.isSeed === true,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

const base = createLocalRepository<Exercise>({
  storageKey: storageKey("exercises"),
  sort: compareByName,
});

let didSeed = false;

/**
 * Idempotent seed merge:
 * - Insert seed exercises only when their slug is missing
 * - Never overwrite user edits
 * - Never create duplicates
 */
function ensureSeeded() {
  if (didSeed) return;
  didSeed = true;

  if (typeof window === "undefined") return;

  const existing = base.getAll() as Array<Partial<Exercise> & { id: string }>;
  const normalized = existing
    .map(normalizeExercise)
    .filter((item): item is Exercise => item !== null);

  const bySlug = new Set(normalized.map((item) => item.slug));
  const seeds = buildSeedExercises();
  const missing = seeds.filter((seed) => !bySlug.has(seed.slug));

  const needsRewrite =
    missing.length > 0 ||
    normalized.length !== existing.length ||
    existing.some((source) => {
      const match = normalized.find((item) => item.id === source.id);
      return !match;
    });

  if (!needsRewrite) {
    if (normalized.length !== existing.length) {
      base.replaceAll(normalized, { silent: true });
    }
    return;
  }

  base.replaceAll([...normalized, ...missing], { silent: true });
}

export const ExerciseRepository = {
  getAll(): Exercise[] {
    ensureSeeded();
    return base.getAll();
  },

  getActive(): Exercise[] {
    return this.getAll().filter((item) => item.status === "active");
  },

  getArchived(): Exercise[] {
    return this.getAll().filter((item) => item.status === "archived");
  },

  getById(id: string): Exercise | null {
    ensureSeeded();
    return base.getById(id);
  },

  getBySlug(slug: string): Exercise | null {
    return this.getAll().find((item) => item.slug === slug) ?? null;
  },

  create(entry: Omit<Exercise, "id"> & { id?: string }): Exercise {
    ensureSeeded();
    return base.create(entry);
  },

  update(id: string, patch: Partial<Omit<Exercise, "id">>): Exercise | null {
    ensureSeeded();
    return base.update(id, patch);
  },

  remove(id: string): boolean {
    ensureSeeded();
    return base.remove(id);
  },

  clear(): void {
    ensureSeeded();
    base.clear();
  },

  replaceAll(entries: Exercise[], options?: { silent?: boolean }): void {
    ensureSeeded();
    base.replaceAll(entries, options);
  },

  subscribe(listener: () => void): () => void {
    return base.subscribe(listener);
  },

  refresh(): void {
    didSeed = false;
    base.refresh();
  },

  /** Test helper — reset seed gate without touching storage. */
  _resetSeedGate(): void {
    didSeed = false;
  },
};
