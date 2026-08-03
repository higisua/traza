import { createId } from "@/lib/storage/localStorage";
import { ExerciseRepository } from "@/features/exercises/exerciseRepository";
import { LOAD_INCREMENTS } from "@/features/exercises/exerciseTypes";
import { estimateDurationFromBlocks } from "./routineMapping";
import {
  getRoutineLivingStats,
  getRoutineReferences,
  hasCompletedRoutineHistory,
} from "./routineReferences";
import { RoutineRepository } from "./routineRepository";
import {
  cloneBlocks,
  normalizeBlockInput,
} from "./routineSeed";
import {
  decideVersionAction,
  hasVersionPayloadChange,
  isStructuralChange,
} from "./routineVersioning";
import type {
  Routine,
  RoutineBlock,
  RoutineDuplicateOptions,
  RoutineFieldErrors,
  RoutineFilters,
  RoutineInput,
  RoutineLivingStats,
  RoutineReferenceSummary,
  RoutineUpdateOptions,
  RoutineValidationResult,
  RoutineVersion,
  RoutineWithVersion,
  VersionDecision,
} from "./routineTypes";
import {
  DEFAULT_ROUTINE_DUPLICATE_OPTIONS,
  DEFAULT_ROUTINE_REST_SECONDS,
  DEFAULT_ROUTINE_TARGET_RIR,
} from "./routineTypes";

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
  const root = base || "rutina";
  let candidate = root;
  let n = 2;
  while (true) {
    const hit = RoutineRepository.getBySlug(candidate);
    if (!hit || hit.id === excludeId) return candidate;
    candidate = `${root}-${n}`;
    n += 1;
  }
}

function uniqueCopyName(name: string): string {
  const root = name.trim() || "Rutina";
  const base = `${root} (copia)`;
  const existing = new Set(
    RoutineRepository.getAll().map((item) => item.nameEs.toLowerCase()),
  );
  if (!existing.has(base.toLowerCase())) return base;
  let n = 2;
  while (existing.has(`${root} (copia ${n})`.toLowerCase())) {
    n += 1;
  }
  return `${root} (copia ${n})`;
}

function parseOptionalInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
  return value;
}

function parseOptionalNumber(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return value;
}

export const RoutineService = {
  defaultsForCreate(): RoutineInput {
    return {
      name: "",
      nameEs: "",
      description: "",
      goal: null,
      estimatedDurationMinutes: 45,
      defaultRestSeconds: DEFAULT_ROUTINE_REST_SECONDS,
      defaultTargetRir: DEFAULT_ROUTINE_TARGET_RIR,
      blocks: [],
    };
  },

  /**
   * Block defaults when adding an exercise.
   * Routine-level rest/RIR override library defaults for new blocks only.
   */
  defaultsFromExercise(
    exerciseSlug: string,
    routineDefaults?: {
      defaultRestSeconds?: number;
      defaultTargetRir?: number;
    },
  ): RoutineInput["blocks"][number] | null {
    const exercise = ExerciseRepository.getBySlug(exerciseSlug);
    if (!exercise || exercise.status !== "active") return null;

    const isTimed =
      exercise.recordingType === "timed" || exercise.recordingType === "cardio";

    const restSeconds =
      routineDefaults?.defaultRestSeconds ?? exercise.defaults.restSeconds;
    const targetRir =
      routineDefaults?.defaultTargetRir ?? exercise.defaults.targetRir;

    return {
      exerciseSlug,
      sets: exercise.defaults.sets,
      repMin: exercise.defaults.repMin,
      repMax: exercise.defaults.repMax,
      rirMin: targetRir,
      rirMax: targetRir,
      restSeconds: isTimed ? 0 : restSeconds,
      durationMinutes: null,
      durationSeconds: isTimed ? 30 : null,
      comment: null,
      loadIncrementOverride: null,
      pairGroup: null,
      blockKind: "single",
      tempo: null,
      groupId: null,
    };
  },

  validate(
    raw: {
      name: string;
      description?: string;
      goal?: string;
      estimatedDurationMinutes: string;
      defaultRestSeconds?: string;
      defaultTargetRir?: string;
      blocks: Array<{
        exerciseSlug: string;
        sets: string;
        repMin: string;
        repMax: string;
        rirMin: string;
        rirMax: string;
        restSeconds: string;
        durationMinutes?: string;
        durationSeconds?: string;
        comment?: string;
        loadIncrementOverride?: string;
        id?: string;
      }>;
      nameEs?: string;
      slug?: string;
    },
    options?: { excludeId?: string },
  ): RoutineValidationResult {
    const errors: RoutineFieldErrors = {};

    const name = raw.name.trim();
    if (!name) {
      errors.name = "El nombre es obligatorio";
    } else if (name.length < 2) {
      errors.name = "Usa al menos 2 caracteres";
    } else if (name.length > 80) {
      errors.name = "Máximo 80 caracteres";
    }

    const description = (raw.description ?? "").trim();
    if (description.length > 280) {
      errors.description = "Máximo 280 caracteres";
    }

    const goal = (raw.goal ?? "").trim();
    if (goal.length > 120) {
      errors.goal = "Máximo 120 caracteres";
    }

    const duration = Number(raw.estimatedDurationMinutes);
    if (!Number.isFinite(duration) || duration < 5 || duration > 240) {
      errors.estimatedDurationMinutes = "Entre 5 y 240 minutos";
    }

    if (!raw.blocks.length) {
      errors.blocks = "Añade al menos un ejercicio";
    }

    const blocks: RoutineInput["blocks"] = [];
    for (const block of raw.blocks) {
      const exercise = ExerciseRepository.getBySlug(block.exerciseSlug);
      if (!exercise) {
        errors.blocks = "Hay un ejercicio que ya no existe en la biblioteca";
        break;
      }
      if (exercise.status !== "active" && !options?.excludeId) {
        // Allow archived exercise only when editing existing structure that still references it.
      }

      const sets = Number(block.sets);
      if (!Number.isFinite(sets) || sets < 1 || sets > 20) {
        errors.blocks = "Series: entre 1 y 20";
        break;
      }

      const restSeconds = Number(block.restSeconds);
      if (!Number.isFinite(restSeconds) || restSeconds < 0 || restSeconds > 600) {
        errors.blocks = "Descanso: entre 0 y 600 segundos";
        break;
      }

      const repMin = parseOptionalInt(block.repMin);
      const repMax = parseOptionalInt(block.repMax);
      if (
        (block.repMin.trim() && repMin == null) ||
        (block.repMax.trim() && repMax == null)
      ) {
        errors.blocks = "Repeticiones no válidas";
        break;
      }
      if (repMin != null && repMax != null && repMin > repMax) {
        errors.blocks = "Rep mín. no puede ser mayor que rep máx.";
        break;
      }

      const rirMin = parseOptionalInt(block.rirMin);
      const rirMax = parseOptionalInt(block.rirMax);
      if (
        (block.rirMin.trim() && rirMin == null) ||
        (block.rirMax.trim() && rirMax == null)
      ) {
        errors.blocks = "RIR no válido";
        break;
      }
      if (rirMin != null && (rirMin < 0 || rirMin > 5)) {
        errors.blocks = "RIR entre 0 y 5";
        break;
      }
      if (rirMax != null && (rirMax < 0 || rirMax > 5)) {
        errors.blocks = "RIR entre 0 y 5";
        break;
      }
      if (rirMin != null && rirMax != null && rirMin > rirMax) {
        errors.blocks = "RIR mín. no puede ser mayor que RIR máx.";
        break;
      }

      const durationMinutes = block.durationMinutes?.trim()
        ? Number(block.durationMinutes)
        : null;
      const durationSeconds = block.durationSeconds?.trim()
        ? Number(block.durationSeconds)
        : null;

      if (
        durationMinutes != null &&
        (!Number.isFinite(durationMinutes) || durationMinutes < 0)
      ) {
        errors.blocks = "Duración en minutos no válida";
        break;
      }
      if (
        durationSeconds != null &&
        (!Number.isFinite(durationSeconds) || durationSeconds < 0)
      ) {
        errors.blocks = "Duración en segundos no válida";
        break;
      }

      const loadRaw = block.loadIncrementOverride?.trim() ?? "";
      let loadIncrementOverride: number | null = null;
      if (loadRaw) {
        const parsed = parseOptionalNumber(loadRaw);
        if (
          parsed == null ||
          !(LOAD_INCREMENTS as readonly number[]).includes(parsed)
        ) {
          errors.blocks = "Incremento de carga no válido";
          break;
        }
        loadIncrementOverride = parsed;
      }

      blocks.push({
        id: block.id,
        exerciseSlug: block.exerciseSlug,
        sets,
        repMin,
        repMax,
        rirMin,
        rirMax,
        restSeconds,
        durationMinutes,
        durationSeconds,
        comment: block.comment?.trim() || null,
        loadIncrementOverride,
        pairGroup: null,
        blockKind: "single",
        tempo: null,
        groupId: null,
      });
    }

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors };
    }

    const defaultRestRaw = Number(
      raw.defaultRestSeconds ?? DEFAULT_ROUTINE_REST_SECONDS,
    );
    const defaultRirRaw = Number(
      raw.defaultTargetRir ?? DEFAULT_ROUTINE_TARGET_RIR,
    );

    const defaultRestSeconds =
      Number.isFinite(defaultRestRaw) && defaultRestRaw >= 0
        ? Math.min(600, Math.round(defaultRestRaw))
        : DEFAULT_ROUTINE_REST_SECONDS;
    const defaultTargetRir = Number.isFinite(defaultRirRaw)
      ? Math.max(0, Math.min(4, Math.round(defaultRirRaw)))
      : DEFAULT_ROUTINE_TARGET_RIR;

    return {
      ok: true,
      value: {
        name,
        nameEs: (raw.nameEs ?? name).trim() || name,
        description,
        goal: goal || null,
        estimatedDurationMinutes: duration,
        defaultRestSeconds,
        defaultTargetRir,
        blocks,
        slug: raw.slug,
      },
    };
  },

  search(filters: RoutineFilters = {}): Routine[] {
    const query = filters.query?.trim().toLowerCase() ?? "";
    const status = filters.status ?? "active";

    return RoutineRepository.getAll().filter((routine) => {
      if (status !== "all" && routine.status !== status) return false;
      if (!query) return true;
      const haystack = [
        routine.nameEs,
        routine.name,
        routine.description,
        routine.goal ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  },

  getById(id: string): Routine | null {
    return RoutineRepository.getById(id);
  },

  getBySlug(slug: string): Routine | null {
    return RoutineRepository.getBySlug(slug);
  },

  getWithCurrentVersion(id: string): RoutineWithVersion | null {
    const routine = RoutineRepository.getById(id);
    if (!routine) return null;
    const version = RoutineRepository.getCurrentVersion(routine);
    if (!version) return null;
    return { routine, version };
  },

  getReferences(id: string): RoutineReferenceSummary {
    return getRoutineReferences(id);
  },

  getLivingStats(id: string): RoutineLivingStats {
    return getRoutineLivingStats(id);
  },

  assessUpdate(
    id: string,
    input: RoutineInput,
  ): VersionDecision & {
    structural: boolean;
    needsVersionChoice: boolean;
  } {
    const routine = RoutineRepository.getById(id);
    if (!routine) {
      return {
        action: "inplace",
        reason: "descriptive_only",
        structural: false,
        needsVersionChoice: false,
      };
    }
    const current = RoutineRepository.getCurrentVersion(routine);
    if (!current) {
      return {
        action: "inplace",
        reason: "descriptive_only",
        structural: false,
        needsVersionChoice: false,
      };
    }

    const nextBlocks = input.blocks.map((block, index) =>
      normalizeBlockInput(block, index + 1),
    );
    const structural = isStructuralChange(current, nextBlocks);
    const hasHistory = hasCompletedRoutineHistory(routine.id);
    const decision = decideVersionAction({
      structural,
      hasCompletedHistory: hasHistory,
    });
    return {
      ...decision,
      structural,
      needsVersionChoice: structural && hasHistory,
    };
  },

  create(input: RoutineInput): Routine {
    const now = new Date().toISOString();
    const slug = ensureUniqueSlug(slugify(input.slug ?? input.nameEs ?? input.name));
    const blocks = input.blocks.map((block, index) =>
      normalizeBlockInput(block, index + 1),
    );
    const estimated =
      input.estimatedDurationMinutes || estimateDurationFromBlocks(blocks);
    const versionId = createId();

    RoutineRepository.createVersion({
      id: versionId,
      routineId: slug,
      versionNumber: 1,
      blocks,
      estimatedDurationMinutes: estimated,
      exerciseCount: blocks.length,
      createdAt: now,
    });

    return RoutineRepository.createRoutine({
      id: slug,
      slug,
      name: input.name,
      nameEs: input.nameEs?.trim() || input.name,
      description: input.description?.trim() || "",
      goal: input.goal?.trim() || null,
      defaultRestSeconds:
        input.defaultRestSeconds ?? DEFAULT_ROUTINE_REST_SECONDS,
      defaultTargetRir: input.defaultTargetRir ?? DEFAULT_ROUTINE_TARGET_RIR,
      status: "active",
      currentVersionId: versionId,
      currentVersionNumber: 1,
      isSeed: false,
      createdAt: now,
      updatedAt: now,
    });
  },

  update(
    id: string,
    input: RoutineInput,
    options: RoutineUpdateOptions = {},
  ): Routine | null {
    const routine = RoutineRepository.getById(id);
    if (!routine) return null;
    const current = RoutineRepository.getCurrentVersion(routine);
    if (!current) return null;

    const now = new Date().toISOString();
    const nameEs = input.nameEs?.trim() || input.name;
    const nextBlocks = input.blocks.map((block, index) =>
      normalizeBlockInput(
        {
          ...block,
          pairGroup:
            block.pairGroup ??
            current.blocks.find((b) => b.id === block.id)?.pairGroup ??
            null,
          groupId:
            block.groupId ??
            current.blocks.find((b) => b.id === block.id)?.groupId ??
            null,
          blockKind:
            block.blockKind ??
            current.blocks.find((b) => b.id === block.id)?.blockKind ??
            "single",
          tempo:
            block.tempo ??
            current.blocks.find((b) => b.id === block.id)?.tempo ??
            null,
        },
        index + 1,
      ),
    );
    const estimated =
      input.estimatedDurationMinutes || estimateDurationFromBlocks(nextBlocks);

    const structural = isStructuralChange(current, nextBlocks);
    const decision = decideVersionAction({
      structural,
      hasCompletedHistory: hasCompletedRoutineHistory(routine.id),
      versionMode: options.versionMode,
    });

    let currentVersionId = routine.currentVersionId;
    let currentVersionNumber = routine.currentVersionNumber;

    const payloadChanged = hasVersionPayloadChange(
      current,
      nextBlocks,
      estimated,
    );

    if (structural && decision.action === "new_version") {
      const version = RoutineRepository.createVersion({
        routineId: routine.id,
        versionNumber: routine.currentVersionNumber + 1,
        blocks: nextBlocks.map((block) => ({ ...block, id: createId() })),
        estimatedDurationMinutes: estimated,
        exerciseCount: nextBlocks.length,
        createdAt: now,
      });
      currentVersionId = version.id;
      currentVersionNumber = version.versionNumber;
    } else if (payloadChanged || structural) {
      RoutineRepository.updateVersion(current.id, {
        blocks: nextBlocks,
        estimatedDurationMinutes: estimated,
        exerciseCount: nextBlocks.length,
      });
    }

    return RoutineRepository.updateRoutine(id, {
      name: input.name,
      nameEs,
      description: input.description?.trim() || "",
      goal: input.goal?.trim() || null,
      defaultRestSeconds:
        input.defaultRestSeconds ??
        routine.defaultRestSeconds ??
        DEFAULT_ROUTINE_REST_SECONDS,
      defaultTargetRir:
        input.defaultTargetRir ??
        routine.defaultTargetRir ??
        DEFAULT_ROUTINE_TARGET_RIR,
      currentVersionId,
      currentVersionNumber,
      updatedAt: now,
    });
  },

  duplicate(
    id: string,
    options?: Partial<RoutineDuplicateOptions>,
  ): Routine | null {
    const source = this.getWithCurrentVersion(id);
    if (!source) return null;

    const opts: RoutineDuplicateOptions = {
      ...DEFAULT_ROUTINE_DUPLICATE_OPTIONS,
      ...options,
    };

    if (!opts.exercises) {
      return null;
    }

    const nameEs = uniqueCopyName(source.routine.nameEs);
    const blocks = cloneBlocks(source.version.blocks).map((block) => {
      const libraryDefaults = this.defaultsFromExercise(block.exerciseSlug);
      return {
        exerciseSlug: block.exerciseSlug,
        sets: opts.configuration
          ? block.sets
          : (libraryDefaults?.sets ?? block.sets),
        repMin: opts.configuration
          ? block.repMin
          : (libraryDefaults?.repMin ?? null),
        repMax: opts.configuration
          ? block.repMax
          : (libraryDefaults?.repMax ?? null),
        rirMin: opts.configuration
          ? block.rirMin
          : (libraryDefaults?.rirMin ?? null),
        rirMax: opts.configuration
          ? block.rirMax
          : (libraryDefaults?.rirMax ?? null),
        restSeconds: opts.rests
          ? block.restSeconds
          : (libraryDefaults?.restSeconds ?? 90),
        durationMinutes: opts.configuration
          ? block.durationMinutes
          : (libraryDefaults?.durationMinutes ?? null),
        durationSeconds: opts.configuration
          ? block.durationSeconds
          : (libraryDefaults?.durationSeconds ?? null),
        comment: opts.notes ? block.comment : null,
        loadIncrementOverride: opts.configuration
          ? block.loadIncrementOverride
          : null,
        pairGroup: block.pairGroup,
        blockKind: block.blockKind,
        tempo: block.tempo,
        groupId: block.groupId,
      };
    });

    return this.create({
      name: nameEs,
      nameEs,
      description: source.routine.description,
      goal: source.routine.goal,
      estimatedDurationMinutes: source.version.estimatedDurationMinutes,
      defaultRestSeconds:
        source.routine.defaultRestSeconds ?? DEFAULT_ROUTINE_REST_SECONDS,
      defaultTargetRir:
        source.routine.defaultTargetRir ?? DEFAULT_ROUTINE_TARGET_RIR,
      blocks,
    });
  },

  archive(id: string): Routine | null {
    return RoutineRepository.updateRoutine(id, {
      status: "archived",
      updatedAt: new Date().toISOString(),
    });
  },

  /** Restore archived → active (also the product “activate” action). */
  restore(id: string): Routine | null {
    return RoutineRepository.updateRoutine(id, {
      status: "active",
      updatedAt: new Date().toISOString(),
    });
  },

  activate(id: string): Routine | null {
    return this.restore(id);
  },

  delete(id: string): { ok: true } | { ok: false; reason: string } {
    const refs = getRoutineReferences(id);
    if (!refs.canHardDelete) {
      return {
        ok: false,
        reason:
          "No se puede eliminar: hay entrenamientos vinculados. Archívala en su lugar.",
      };
    }
    const removed = RoutineRepository.removeRoutine(id);
    if (!removed) {
      return { ok: false, reason: "No se encontró la rutina" };
    }
    return { ok: true };
  },

  listVersions(routineId: string): RoutineVersion[] {
    return RoutineRepository.getVersionsForRoutine(routineId);
  },

  /** Reorder helper — architecture for future DnD. */
  moveBlock(blocks: RoutineBlock[], fromIndex: number, toIndex: number): RoutineBlock[] {
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= blocks.length ||
      toIndex >= blocks.length ||
      fromIndex === toIndex
    ) {
      return blocks;
    }
    const next = [...blocks];
    const [item] = next.splice(fromIndex, 1);
    if (!item) return blocks;
    next.splice(toIndex, 0, item);
    return next.map((block, index) => ({ ...block, order: index + 1 }));
  },
};
