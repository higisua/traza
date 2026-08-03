import type {
  Routine,
  RoutineBlock,
  RoutineBlockInput,
  RoutineVersion,
  RoutineVersionSaveMode,
  VersionDecision,
} from "./routineTypes";

function sortedBlocks(blocks: RoutineBlock[]): RoutineBlock[] {
  return [...blocks].sort((a, b) => a.order - b.order);
}

/**
 * Structural fingerprint — prescription that affects how the workout is trained.
 * Excludes notes (comment) and estimated duration (minor / descriptive).
 */
function structuralFingerprint(blocks: RoutineBlock[]): string {
  return sortedBlocks(blocks)
    .map((b) =>
      [
        b.exerciseSlug,
        b.sets,
        b.repMin ?? "",
        b.repMax ?? "",
        b.rirMin ?? "",
        b.rirMax ?? "",
        b.restSeconds,
        b.durationMinutes ?? "",
        b.durationSeconds ?? "",
        b.loadIncrementOverride ?? "",
        b.pairGroup ?? "",
        b.blockKind,
        b.tempo ?? "",
        b.groupId ?? "",
      ].join("|"),
    )
    .join("||");
}

/** True when blocks/prescription changed (not name/goal/duration/notes alone). */
export function isStructuralChange(
  current: RoutineVersion,
  nextBlocks: RoutineBlock[],
  _nextEstimatedDuration?: number,
): boolean {
  if (current.blocks.length !== nextBlocks.length) {
    return true;
  }
  return (
    structuralFingerprint(current.blocks) !==
    structuralFingerprint(nextBlocks)
  );
}

/** Notes or estimated duration changed without structural prescription change. */
export function hasVersionPayloadChange(
  current: RoutineVersion,
  nextBlocks: RoutineBlock[],
  nextEstimatedDuration: number,
): boolean {
  if (current.estimatedDurationMinutes !== nextEstimatedDuration) {
    return true;
  }
  if (current.blocks.length !== nextBlocks.length) {
    return true;
  }
  const sortedCurrent = sortedBlocks(current.blocks);
  const sortedNext = sortedBlocks(nextBlocks);
  for (let i = 0; i < sortedCurrent.length; i += 1) {
    const a = sortedCurrent[i];
    const b = sortedNext[i];
    if (!a || !b) return true;
    if ((a.comment ?? null) !== (b.comment ?? null)) return true;
    if (a.id !== b.id) return true;
  }
  return isStructuralChange(current, nextBlocks);
}

export function isDescriptiveOnlyChange(
  routine: Routine,
  next: {
    name: string;
    nameEs: string;
    description: string;
    goal: string | null;
  },
): boolean {
  return (
    routine.name !== next.name ||
    routine.nameEs !== next.nameEs ||
    routine.description !== next.description ||
    (routine.goal ?? null) !== (next.goal ?? null)
  );
}

/**
 * Decide whether an update mutates the current version or creates a new one.
 *
 * Rules (Decision 018 + Phase 7.2 UX):
 * - Minor (name / description / goal / estimated duration / notes) → in-place.
 * - Structural + no completed sessions → in-place on current version.
 * - Structural + completed history → ask user (UI); auto default is new_version.
 */
export function decideVersionAction(options: {
  structural: boolean;
  hasCompletedHistory: boolean;
  versionMode?: RoutineVersionSaveMode;
}): VersionDecision {
  if (!options.structural) {
    return { action: "inplace", reason: "descriptive_only" };
  }
  if (options.versionMode === "inplace") {
    return { action: "inplace", reason: "user_overwrite" };
  }
  if (options.versionMode === "new_version") {
    return { action: "new_version", reason: "user_new_version" };
  }
  if (!options.hasCompletedHistory) {
    return { action: "inplace", reason: "no_completed_history" };
  }
  return { action: "new_version", reason: "structural_with_history" };
}

export function blocksEqualForStructure(
  a: RoutineBlockInput[],
  b: RoutineBlock[],
): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a];
  const sortedB = sortedBlocks(b);
  for (let i = 0; i < sortedA.length; i += 1) {
    const left = sortedA[i];
    const right = sortedB[i];
    if (!left || !right) return false;
    if (left.exerciseSlug !== right.exerciseSlug) return false;
    if (left.sets !== right.sets) return false;
    if ((left.repMin ?? null) !== (right.repMin ?? null)) return false;
    if ((left.repMax ?? null) !== (right.repMax ?? null)) return false;
    if ((left.rirMin ?? null) !== (right.rirMin ?? null)) return false;
    if ((left.rirMax ?? null) !== (right.rirMax ?? null)) return false;
    if (left.restSeconds !== right.restSeconds) return false;
    if ((left.durationMinutes ?? null) !== (right.durationMinutes ?? null)) {
      return false;
    }
    if ((left.durationSeconds ?? null) !== (right.durationSeconds ?? null)) {
      return false;
    }
    if (
      (left.loadIncrementOverride ?? null) !==
      (right.loadIncrementOverride ?? null)
    ) {
      return false;
    }
  }
  return true;
}
