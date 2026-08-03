import workoutSeed from "@/seed/workout_seed.json";
import { createId } from "@/lib/storage/localStorage";
import type {
  Routine,
  RoutineBlock,
  RoutineBlockInput,
  RoutineVersion,
} from "./routineTypes";

const ROUTINE_NAMES_ES: Record<string, string> = {
  "day-a": "Día A",
  "day-b": "Día B",
  "day-c": "Día C",
  home: "Casa",
};

const ROUTINE_DESCRIPTIONS_ES: Record<string, string> = {
  "day-a": "Full body A",
  "day-b": "Full body B",
  "day-c": "Full body opcional",
  home: "Sesión corta en casa",
};

const ROUTINE_GOALS_ES: Record<string, string> = {
  "day-a": "Fuerza y volumen full body",
  "day-b": "Fuerza y volumen full body (variante B)",
  "day-c": "Sesión opcional de volumen",
  home: "Mantenimiento en casa",
};

type SeedRoutineExercise = {
  exerciseSlug: string;
  order: number;
  sets?: number;
  repRange?: { min: number; max: number };
  rir?: { min: number; max: number };
  restSeconds?: number;
  durationMinutes?: number;
  durationSeconds?: number;
  pair?: string;
};

type SeedRoutine = {
  slug: string;
  name: string;
  description: string;
  estimatedDurationMinutes: number;
  exercises: SeedRoutineExercise[];
};

export const SEED_ROUTINE_COUNT = 4;

/** Stable seed version id — matches sessions already stored as `${slug}:v1`. */
export function seedVersionId(slug: string): string {
  return `${slug}:v1`;
}

function buildSeedBlock(
  routineSlug: string,
  seed: SeedRoutineExercise,
): RoutineBlock {
  const isTimed =
    seed.durationMinutes != null || seed.durationSeconds != null;
  return {
    id: `${routineSlug}-block-${seed.order}`,
    exerciseSlug: seed.exerciseSlug,
    order: seed.order,
    sets: seed.sets ?? (isTimed ? 1 : 3),
    repMin: seed.repRange?.min ?? null,
    repMax: seed.repRange?.max ?? null,
    rirMin: seed.rir?.min ?? null,
    rirMax: seed.rir?.max ?? null,
    restSeconds:
      seed.restSeconds ?? (isTimed ? 0 : 90),
    durationMinutes: seed.durationMinutes ?? null,
    durationSeconds: seed.durationSeconds ?? null,
    comment: null,
    loadIncrementOverride: null,
    pairGroup: seed.pair ?? null,
    blockKind: "single",
    tempo: null,
    groupId: null,
  };
}

export function buildSeedRoutines(): {
  routines: Routine[];
  versions: RoutineVersion[];
} {
  const now = new Date().toISOString();
  const routines: Routine[] = [];
  const versions: RoutineVersion[] = [];

  for (const raw of workoutSeed as SeedRoutine[]) {
    const slug = raw.slug;
    const versionId = seedVersionId(slug);
    const blocks = raw.exercises
      .map((exercise) => buildSeedBlock(slug, exercise))
      .sort((a, b) => a.order - b.order);

    const version: RoutineVersion = {
      id: versionId,
      routineId: slug,
      versionNumber: 1,
      blocks,
      estimatedDurationMinutes: raw.estimatedDurationMinutes,
      exerciseCount: blocks.length,
      createdAt: now,
    };

    const routine: Routine = {
      id: slug,
      slug,
      name: raw.name,
      nameEs: ROUTINE_NAMES_ES[slug] ?? raw.name,
      description: ROUTINE_DESCRIPTIONS_ES[slug] ?? raw.description,
      goal: ROUTINE_GOALS_ES[slug] ?? null,
      defaultRestSeconds: 90,
      defaultTargetRir: 2,
      status: "active",
      currentVersionId: versionId,
      currentVersionNumber: 1,
      isSeed: true,
      createdAt: now,
      updatedAt: now,
    };

    routines.push(routine);
    versions.push(version);
  }

  return { routines, versions };
}

export function normalizeBlockInput(
  input: RoutineBlockInput,
  order: number,
): RoutineBlock {
  const isTimed =
    input.durationMinutes != null || input.durationSeconds != null;
  return {
    id: input.id ?? createId(),
    exerciseSlug: input.exerciseSlug,
    order,
    sets: input.sets,
    repMin: input.repMin,
    repMax: input.repMax,
    rirMin: input.rirMin,
    rirMax: input.rirMax,
    restSeconds: input.restSeconds,
    durationMinutes: input.durationMinutes ?? null,
    durationSeconds: input.durationSeconds ?? null,
    comment: input.comment?.trim() ? input.comment.trim() : null,
    loadIncrementOverride:
      typeof input.loadIncrementOverride === "number" &&
      Number.isFinite(input.loadIncrementOverride)
        ? input.loadIncrementOverride
        : null,
    pairGroup: input.pairGroup ?? null,
    blockKind: input.blockKind ?? "single",
    tempo: input.tempo ?? null,
    groupId: input.groupId ?? null,
    // Timed blocks still expose sets for session baking; default 1 when omitted upstream.
    ...(isTimed && input.sets < 1 ? { sets: 1 } : {}),
  };
}

export function cloneBlocks(blocks: RoutineBlock[]): RoutineBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    id: createId(),
    order: index + 1,
  }));
}
