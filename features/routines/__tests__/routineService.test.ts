import { describe, expect, it, beforeEach, vi } from "vitest";
import { ExerciseRepository } from "@/features/exercises/exerciseRepository";
import { trainingStorage } from "@/lib/storage/trainingStorage";
import { buildSeedRoutines, SEED_ROUTINE_COUNT } from "../routineSeed";
import { RoutineRepository } from "../routineRepository";
import { RoutineService } from "../routineService";
import { decideVersionAction, isStructuralChange } from "../routineVersioning";

beforeEach(() => {
  vi.stubGlobal("window", {
    localStorage: (() => {
      const store = new Map<string, string>();
      return {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      };
    })(),
  });
  RoutineRepository._resetSeedGate();
  RoutineRepository.clear();
  RoutineRepository._resetSeedGate();
  ExerciseRepository._resetSeedGate();
  ExerciseRepository.clear();
  ExerciseRepository._resetSeedGate();
  trainingStorage.clearSessions();
});

describe("routine seed", () => {
  it("builds 4 seed routines with stable slug ids and v1 version ids", () => {
    const { routines, versions } = buildSeedRoutines();
    expect(routines).toHaveLength(SEED_ROUTINE_COUNT);
    expect(versions).toHaveLength(SEED_ROUTINE_COUNT);
    expect(SEED_ROUTINE_COUNT).toBe(4);
    expect(routines.every((r) => r.id === r.slug && r.isSeed)).toBe(true);
    expect(
      versions.every((v) => v.id === `${v.routineId}:v1` && v.versionNumber === 1),
    ).toBe(true);
  });
});

describe("RoutineRepository seed merge", () => {
  it("seeds on first read without duplicates", () => {
    expect(RoutineRepository.getAll()).toHaveLength(4);
    expect(RoutineRepository.getAllVersions()).toHaveLength(4);
    expect(RoutineRepository.getAll()).toHaveLength(4);
  });

  it("never overwrites user edits on re-seed", () => {
    RoutineRepository.getAll();
    const dayA = RoutineRepository.getBySlug("day-a");
    expect(dayA).not.toBeNull();
    RoutineRepository.updateRoutine(dayA!.id, {
      nameEs: "Día A editado",
      updatedAt: new Date().toISOString(),
    });
    RoutineRepository._resetSeedGate();
    expect(RoutineRepository.getBySlug("day-a")?.nameEs).toBe("Día A editado");
    expect(RoutineRepository.getAll()).toHaveLength(4);
  });
});

describe("versioning rules", () => {
  it("keeps descriptive edits in place", () => {
    expect(
      decideVersionAction({ structural: false, hasCompletedHistory: true }),
    ).toEqual({ action: "inplace", reason: "descriptive_only" });
  });

  it("creates a new version only for structural + history", () => {
    expect(
      decideVersionAction({ structural: true, hasCompletedHistory: false }),
    ).toEqual({ action: "inplace", reason: "no_completed_history" });
    expect(
      decideVersionAction({ structural: true, hasCompletedHistory: true }),
    ).toEqual({ action: "new_version", reason: "structural_with_history" });
  });

  it("detects structural block changes", () => {
    const { versions } = buildSeedRoutines();
    const version = versions[0]!;
    const next = version.blocks.map((block, index) =>
      index === 0 ? { ...block, sets: block.sets + 1 } : block,
    );
    expect(isStructuralChange(version, next)).toBe(true);
    expect(isStructuralChange(version, version.blocks)).toBe(false);
  });

  it("treats estimated duration alone as non-structural", () => {
    const { versions } = buildSeedRoutines();
    const version = versions[0]!;
    expect(
      isStructuralChange(
        version,
        version.blocks,
        version.estimatedDurationMinutes + 10,
      ),
    ).toBe(false);
  });
});

describe("RoutineService", () => {
  it("creates, duplicates, archives and restores", () => {
    ExerciseRepository.getAll();
    RoutineRepository.getAll();

    const created = RoutineService.create({
      name: "Empuje",
      nameEs: "Empuje",
      description: "Press focus",
      goal: "Fuerza",
      estimatedDurationMinutes: 40,
      blocks: [
        {
          exerciseSlug: "machine-chest-press",
          sets: 3,
          repMin: 8,
          repMax: 12,
          rirMin: 1,
          rirMax: 2,
          restSeconds: 90,
        },
      ],
    });
    expect(created.slug).toBe("empuje");
    expect(created.currentVersionNumber).toBe(1);
    expect(RoutineRepository.getActive().some((r) => r.id === created.id)).toBe(
      true,
    );

    const copy = RoutineService.duplicate(created.id);
    expect(copy?.nameEs).toContain("copia");
    expect(copy?.currentVersionNumber).toBe(1);
    expect(copy?.id).not.toBe(created.id);

    RoutineService.archive(created.id);
    expect(RoutineRepository.getById(created.id)?.status).toBe("archived");
    RoutineService.restore(created.id);
    expect(RoutineRepository.getById(created.id)?.status).toBe("active");
  });

  it("bumps version when structural edit follows completed history", () => {
    ExerciseRepository.getAll();
    RoutineRepository.getAll();
    const dayA = RoutineRepository.getBySlug("day-a")!;
    const version = RoutineRepository.getCurrentVersion(dayA)!;

    trainingStorage.createSession({
      templateId: dayA.slug,
      templateVersionId: version.id,
      sessionDate: "2026-08-01",
      startTime: "2026-08-01T10:00:00.000Z",
      endTime: "2026-08-01T11:00:00.000Z",
      durationMinutes: 55,
      status: "completed",
      exercises: [],
    });

    const nextBlocks = version.blocks.map((block, index) =>
      index === 0
        ? {
            exerciseSlug: block.exerciseSlug,
            sets: block.sets + 1,
            repMin: block.repMin,
            repMax: block.repMax,
            rirMin: block.rirMin,
            rirMax: block.rirMax,
            restSeconds: block.restSeconds,
            durationMinutes: block.durationMinutes,
            durationSeconds: block.durationSeconds,
            comment: block.comment,
            id: block.id,
          }
        : {
            exerciseSlug: block.exerciseSlug,
            sets: block.sets,
            repMin: block.repMin,
            repMax: block.repMax,
            rirMin: block.rirMin,
            rirMax: block.rirMax,
            restSeconds: block.restSeconds,
            durationMinutes: block.durationMinutes,
            durationSeconds: block.durationSeconds,
            comment: block.comment,
            id: block.id,
          },
    );

    const updated = RoutineService.update(dayA.id, {
      name: dayA.name,
      nameEs: dayA.nameEs,
      description: dayA.description,
      goal: dayA.goal,
      estimatedDurationMinutes: version.estimatedDurationMinutes,
      blocks: nextBlocks,
    });

    expect(updated?.currentVersionNumber).toBe(2);
    expect(updated?.currentVersionId).not.toBe(version.id);
    expect(RoutineRepository.getVersionById(version.id)).not.toBeNull();
    expect(
      RoutineRepository.getVersionsForRoutine(dayA.id),
    ).toHaveLength(2);
  });

  it("updates name without new version", () => {
    RoutineRepository.getAll();
    const dayB = RoutineRepository.getBySlug("day-b")!;
    const before = dayB.currentVersionId;
    const version = RoutineRepository.getCurrentVersion(dayB)!;

    const updated = RoutineService.update(dayB.id, {
      name: "Day B Plus",
      nameEs: "Día B Plus",
      description: dayB.description,
      goal: dayB.goal,
      estimatedDurationMinutes: version.estimatedDurationMinutes,
      blocks: version.blocks.map((block) => ({
        id: block.id,
        exerciseSlug: block.exerciseSlug,
        sets: block.sets,
        repMin: block.repMin,
        repMax: block.repMax,
        rirMin: block.rirMin,
        rirMax: block.rirMax,
        restSeconds: block.restSeconds,
        durationMinutes: block.durationMinutes,
        durationSeconds: block.durationSeconds,
        comment: block.comment,
      })),
    });

    expect(updated?.nameEs).toBe("Día B Plus");
    expect(updated?.currentVersionId).toBe(before);
    expect(updated?.currentVersionNumber).toBe(1);
  });

  it("allows overwrite of current version when user chooses inplace", () => {
    ExerciseRepository.getAll();
    RoutineRepository.getAll();
    const dayA = RoutineRepository.getBySlug("day-a")!;
    const version = RoutineRepository.getCurrentVersion(dayA)!;

    trainingStorage.createSession({
      templateId: dayA.slug,
      templateVersionId: version.id,
      sessionDate: "2026-08-01",
      startTime: "2026-08-01T10:00:00.000Z",
      endTime: "2026-08-01T11:00:00.000Z",
      durationMinutes: 55,
      status: "completed",
      exercises: [],
    });

    const nextBlocks = version.blocks.map((block, index) =>
      index === 0
        ? {
            exerciseSlug: block.exerciseSlug,
            sets: block.sets + 2,
            repMin: block.repMin,
            repMax: block.repMax,
            rirMin: block.rirMin,
            rirMax: block.rirMax,
            restSeconds: block.restSeconds,
            durationMinutes: block.durationMinutes,
            durationSeconds: block.durationSeconds,
            comment: block.comment,
            id: block.id,
          }
        : {
            exerciseSlug: block.exerciseSlug,
            sets: block.sets,
            repMin: block.repMin,
            repMax: block.repMax,
            rirMin: block.rirMin,
            rirMax: block.rirMax,
            restSeconds: block.restSeconds,
            durationMinutes: block.durationMinutes,
            durationSeconds: block.durationSeconds,
            comment: block.comment,
            id: block.id,
          },
    );

    const assessment = RoutineService.assessUpdate(dayA.id, {
      name: dayA.name,
      nameEs: dayA.nameEs,
      description: dayA.description,
      goal: dayA.goal,
      estimatedDurationMinutes: version.estimatedDurationMinutes,
      blocks: nextBlocks,
    });
    expect(assessment.needsVersionChoice).toBe(true);

    const updated = RoutineService.update(
      dayA.id,
      {
        name: dayA.name,
        nameEs: dayA.nameEs,
        description: dayA.description,
        goal: dayA.goal,
        estimatedDurationMinutes: version.estimatedDurationMinutes,
        blocks: nextBlocks,
      },
      { versionMode: "inplace" },
    );

    expect(updated?.currentVersionNumber).toBe(1);
    expect(updated?.currentVersionId).toBe(version.id);
    expect(RoutineRepository.getCurrentVersion(updated!)?.blocks[0]?.sets).toBe(
      version.blocks[0]!.sets + 2,
    );
  });

  it("duplicates with selective options", () => {
    ExerciseRepository.getAll();
    RoutineRepository.getAll();
    const dayA = RoutineRepository.getBySlug("day-a")!;
    const source = RoutineRepository.getCurrentVersion(dayA)!;
    const commented = {
      ...source.blocks[0]!,
      comment: "Nota local",
    };
    RoutineRepository.updateVersion(source.id, {
      blocks: [commented, ...source.blocks.slice(1)],
    });

    const copy = RoutineService.duplicate(dayA.id, {
      exercises: true,
      configuration: true,
      rests: true,
      notes: false,
    });
    expect(copy).not.toBeNull();
    const copyVersion = RoutineRepository.getCurrentVersion(copy!)!;
    expect(copyVersion.blocks[0]?.comment).toBeNull();
    expect(copyVersion.blocks[0]?.sets).toBe(commented.sets);
  });
});
