import { storageKey } from "@/lib/storage/localStorage";
import { createLocalRepository } from "@/lib/modules/createLocalRepository";
import { buildSeedRoutines } from "./routineSeed";
import type { Routine, RoutineStatus, RoutineVersion } from "./routineTypes";
import {
  DEFAULT_ROUTINE_REST_SECONDS,
  DEFAULT_ROUTINE_TARGET_RIR,
} from "./routineTypes";

function compareRoutines(a: Routine, b: Routine): number {
  return a.nameEs.localeCompare(b.nameEs, "es", { sensitivity: "base" });
}

function clampRest(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.min(600, Math.round(value));
  }
  return DEFAULT_ROUTINE_REST_SECONDS;
}

function clampRir(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(4, Math.round(value)));
  }
  return DEFAULT_ROUTINE_TARGET_RIR;
}

function normalizeRoutine(
  raw: Partial<Routine> & { id: string },
): Routine | null {
  if (typeof raw.slug !== "string" || !raw.slug.trim()) return null;
  if (typeof raw.name !== "string" || !raw.name.trim()) return null;
  if (typeof raw.currentVersionId !== "string" || !raw.currentVersionId) {
    return null;
  }

  const status: RoutineStatus =
    raw.status === "archived" ? "archived" : "active";
  const now = new Date().toISOString();

  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    nameEs:
      typeof raw.nameEs === "string" && raw.nameEs.trim()
        ? raw.nameEs
        : raw.name,
    description:
      typeof raw.description === "string" ? raw.description : "",
    goal: typeof raw.goal === "string" && raw.goal.trim() ? raw.goal : null,
    defaultRestSeconds: clampRest(raw.defaultRestSeconds),
    defaultTargetRir: clampRir(raw.defaultTargetRir),
    status,
    currentVersionId: raw.currentVersionId,
    currentVersionNumber:
      typeof raw.currentVersionNumber === "number" &&
      Number.isFinite(raw.currentVersionNumber)
        ? raw.currentVersionNumber
        : 1,
    isSeed: raw.isSeed === true,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

function normalizeBlock(
  raw: Partial<RoutineVersion["blocks"][number]> & { id: string },
  index: number,
): RoutineVersion["blocks"][number] | null {
  if (typeof raw.exerciseSlug !== "string" || !raw.exerciseSlug.trim()) {
    return null;
  }
  return {
    id: raw.id,
    exerciseSlug: raw.exerciseSlug,
    order:
      typeof raw.order === "number" && Number.isFinite(raw.order)
        ? raw.order
        : index + 1,
    sets:
      typeof raw.sets === "number" && Number.isFinite(raw.sets) ? raw.sets : 3,
    repMin:
      typeof raw.repMin === "number" && Number.isFinite(raw.repMin)
        ? raw.repMin
        : null,
    repMax:
      typeof raw.repMax === "number" && Number.isFinite(raw.repMax)
        ? raw.repMax
        : null,
    rirMin:
      typeof raw.rirMin === "number" && Number.isFinite(raw.rirMin)
        ? raw.rirMin
        : null,
    rirMax:
      typeof raw.rirMax === "number" && Number.isFinite(raw.rirMax)
        ? raw.rirMax
        : null,
    restSeconds:
      typeof raw.restSeconds === "number" && Number.isFinite(raw.restSeconds)
        ? raw.restSeconds
        : 90,
    durationMinutes:
      typeof raw.durationMinutes === "number" &&
      Number.isFinite(raw.durationMinutes)
        ? raw.durationMinutes
        : null,
    durationSeconds:
      typeof raw.durationSeconds === "number" &&
      Number.isFinite(raw.durationSeconds)
        ? raw.durationSeconds
        : null,
    comment: typeof raw.comment === "string" ? raw.comment : null,
    loadIncrementOverride:
      typeof raw.loadIncrementOverride === "number" &&
      Number.isFinite(raw.loadIncrementOverride)
        ? raw.loadIncrementOverride
        : null,
    pairGroup: typeof raw.pairGroup === "string" ? raw.pairGroup : null,
    blockKind:
      raw.blockKind === "superset" ||
      raw.blockKind === "dropset" ||
      raw.blockKind === "giant"
        ? raw.blockKind
        : "single",
    tempo: typeof raw.tempo === "string" ? raw.tempo : null,
    groupId: typeof raw.groupId === "string" ? raw.groupId : null,
  };
}

function normalizeVersion(
  raw: Partial<RoutineVersion> & { id: string },
): RoutineVersion | null {
  if (typeof raw.routineId !== "string" || !raw.routineId) return null;
  if (!Array.isArray(raw.blocks)) return null;

  const blocks = raw.blocks
    .map((block, index) => {
      if (!block || typeof block !== "object") return null;
      const id =
        typeof (block as { id?: unknown }).id === "string"
          ? (block as { id: string }).id
          : null;
      if (!id) return null;
      return normalizeBlock(
        block as Partial<RoutineVersion["blocks"][number]> & { id: string },
        index,
      );
    })
    .filter((item): item is RoutineVersion["blocks"][number] => item !== null)
    .sort((a, b) => a.order - b.order);

  const now = new Date().toISOString();

  return {
    id: raw.id,
    routineId: raw.routineId,
    versionNumber:
      typeof raw.versionNumber === "number" && Number.isFinite(raw.versionNumber)
        ? raw.versionNumber
        : 1,
    blocks,
    estimatedDurationMinutes:
      typeof raw.estimatedDurationMinutes === "number" &&
      Number.isFinite(raw.estimatedDurationMinutes)
        ? raw.estimatedDurationMinutes
        : 45,
    exerciseCount:
      typeof raw.exerciseCount === "number" && Number.isFinite(raw.exerciseCount)
        ? raw.exerciseCount
        : blocks.length,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
  };
}

const routinesBase = createLocalRepository<Routine>({
  storageKey: storageKey("routines"),
  sort: compareRoutines,
});

const versionsBase = createLocalRepository<RoutineVersion>({
  storageKey: storageKey("routine_versions"),
});

let didSeed = false;

/**
 * Idempotent seed merge:
 * - Insert seed routines / v1 versions only when slug is missing
 * - Never overwrite user edits
 * - Seed version ids stay `${slug}:v1` for legacy session pointers
 */
function ensureSeeded() {
  if (didSeed) return;
  didSeed = true;

  if (typeof window === "undefined") return;

  const existingRoutines = routinesBase.getAll() as Array<
    Partial<Routine> & { id: string }
  >;
  const existingVersions = versionsBase.getAll() as Array<
    Partial<RoutineVersion> & { id: string }
  >;

  const normalizedRoutines = existingRoutines
    .map(normalizeRoutine)
    .filter((item): item is Routine => item !== null);
  const normalizedVersions = existingVersions
    .map(normalizeVersion)
    .filter((item): item is RoutineVersion => item !== null);

  const bySlug = new Set(normalizedRoutines.map((item) => item.slug));
  const versionIds = new Set(normalizedVersions.map((item) => item.id));

  const seed = buildSeedRoutines();
  const missingRoutines = seed.routines.filter((item) => !bySlug.has(item.slug));
  const missingVersions = seed.versions.filter((item) => !versionIds.has(item.id));

  const routinesNeedRewrite =
    missingRoutines.length > 0 ||
    normalizedRoutines.length !== existingRoutines.length ||
    existingRoutines.some(
      (item) =>
        typeof item.defaultRestSeconds !== "number" ||
        typeof item.defaultTargetRir !== "number",
    );
  const versionsNeedRewrite =
    missingVersions.length > 0 ||
    normalizedVersions.length !== existingVersions.length;

  if (routinesNeedRewrite) {
    routinesBase.replaceAll(
      [...normalizedRoutines, ...missingRoutines],
      { silent: true },
    );
  }

  if (versionsNeedRewrite) {
    versionsBase.replaceAll(
      [...normalizedVersions, ...missingVersions],
      { silent: true },
    );
  }
}

export const RoutineRepository = {
  getAll(): Routine[] {
    ensureSeeded();
    return routinesBase.getAll();
  },

  getActive(): Routine[] {
    return this.getAll().filter((item) => item.status === "active");
  },

  getArchived(): Routine[] {
    return this.getAll().filter((item) => item.status === "archived");
  },

  getById(id: string): Routine | null {
    ensureSeeded();
    return routinesBase.getById(id);
  },

  getBySlug(slug: string): Routine | null {
    return this.getAll().find((item) => item.slug === slug) ?? null;
  },

  getAllVersions(): RoutineVersion[] {
    ensureSeeded();
    return versionsBase.getAll();
  },

  getVersionById(id: string): RoutineVersion | null {
    ensureSeeded();
    return versionsBase.getById(id);
  },

  getVersionsForRoutine(routineId: string): RoutineVersion[] {
    return this.getAllVersions()
      .filter((version) => version.routineId === routineId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  },

  getCurrentVersion(routine: Routine): RoutineVersion | null {
    return this.getVersionById(routine.currentVersionId);
  },

  createRoutine(entry: Omit<Routine, "id"> & { id?: string }): Routine {
    ensureSeeded();
    return routinesBase.create(entry);
  },

  updateRoutine(
    id: string,
    patch: Partial<Omit<Routine, "id">>,
  ): Routine | null {
    ensureSeeded();
    return routinesBase.update(id, patch);
  },

  createVersion(
    entry: Omit<RoutineVersion, "id"> & { id?: string },
  ): RoutineVersion {
    ensureSeeded();
    return versionsBase.create(entry);
  },

  updateVersion(
    id: string,
    patch: Partial<Omit<RoutineVersion, "id">>,
  ): RoutineVersion | null {
    ensureSeeded();
    return versionsBase.update(id, patch);
  },

  removeRoutine(id: string): boolean {
    ensureSeeded();
    const versions = this.getVersionsForRoutine(id);
    for (const version of versions) {
      versionsBase.remove(version.id);
    }
    return routinesBase.remove(id);
  },

  clear(): void {
    ensureSeeded();
    routinesBase.clear();
    versionsBase.clear();
  },

  replaceAll(
    routines: Routine[],
    versions: RoutineVersion[],
    options?: { silent?: boolean },
  ): void {
    ensureSeeded();
    versionsBase.replaceAll(versions, options);
    routinesBase.replaceAll(routines, options);
  },

  subscribe(listener: () => void): () => void {
    const unsubA = routinesBase.subscribe(listener);
    const unsubB = versionsBase.subscribe(listener);
    return () => {
      unsubA();
      unsubB();
    };
  },

  refresh(): void {
    didSeed = false;
    routinesBase.refresh();
    versionsBase.refresh();
  },

  /** Test helper — reset seed gate without touching storage. */
  _resetSeedGate(): void {
    didSeed = false;
  },
};
