import { describe, expect, it, beforeEach, vi } from "vitest";
import { buildSeedExercises, SEED_EXERCISE_COUNT } from "../exerciseSeed";
import { ExerciseRepository } from "../exerciseRepository";
import { ExerciseService } from "../exerciseService";
import { trackingToRecordingType } from "../exerciseMapping";
import { getExerciseReferences } from "../exerciseReferences";

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
  ExerciseRepository._resetSeedGate();
  ExerciseRepository.clear();
  ExerciseRepository._resetSeedGate();
});

describe("exercise seed", () => {
  it("builds exactly 29 seed exercises with stable slugs", () => {
    const seeds = buildSeedExercises();
    expect(seeds).toHaveLength(SEED_EXERCISE_COUNT);
    expect(SEED_EXERCISE_COUNT).toBe(29);
    expect(new Set(seeds.map((s) => s.slug)).size).toBe(29);
    expect(seeds.every((s) => s.id === s.slug)).toBe(true);
    expect(seeds.every((s) => s.isSeed && s.status === "active")).toBe(true);
  });

  it("maps tracking types to recording types", () => {
    expect(trackingToRecordingType("Weight")).toBe("strength");
    expect(trackingToRecordingType("Repetitions")).toBe("bodyweight");
    expect(trackingToRecordingType("Time")).toBe("timed");
    expect(trackingToRecordingType("Cardio")).toBe("cardio");
  });
});

describe("ExerciseRepository seed merge", () => {
  it("seeds on first read without duplicates", () => {
    const first = ExerciseRepository.getAll();
    expect(first).toHaveLength(29);
    const second = ExerciseRepository.getAll();
    expect(second).toHaveLength(29);
  });

  it("never overwrites user edits on re-seed", () => {
    ExerciseRepository.getAll();
    const hack = ExerciseRepository.getBySlug("hack-squat");
    expect(hack).not.toBeNull();
    ExerciseRepository.update(hack!.id, {
      nameEs: "Hack squat editado",
      updatedAt: new Date().toISOString(),
    });
    ExerciseRepository._resetSeedGate();
    const again = ExerciseRepository.getBySlug("hack-squat");
    expect(again?.nameEs).toBe("Hack squat editado");
    expect(ExerciseRepository.getAll()).toHaveLength(29);
  });
});

describe("ExerciseService CRUD", () => {
  it("creates strength and timed exercises with unique slugs", () => {
    ExerciseRepository.getAll();
    const strength = ExerciseService.create({
      ...ExerciseService.defaultsForCreate("strength"),
      name: "Press banca libre",
      primaryMuscle: "Chest",
    });
    expect(strength.recordingType).toBe("strength");
    expect(strength.slug).toBe("press-banca-libre");

    const timed = ExerciseService.create({
      ...ExerciseService.defaultsForCreate("timed"),
      name: "Plancha frontal",
      primaryMuscle: "Core",
    });
    expect(timed.recordingType).toBe("timed");
    expect(timed.defaults.repMin).toBeNull();
  });

  it("archives and restores", () => {
    ExerciseRepository.getAll();
    const created = ExerciseService.create({
      ...ExerciseService.defaultsForCreate("bodyweight"),
      name: "Dominadas",
      primaryMuscle: "Back",
    });
    ExerciseService.archive(created.id);
    expect(ExerciseService.getById(created.id)?.status).toBe("archived");
    expect(ExerciseService.getActive().some((e) => e.id === created.id)).toBe(
      false,
    );
    ExerciseService.restore(created.id);
    expect(ExerciseService.getById(created.id)?.status).toBe("active");
  });

  it("duplicates into a personal active copy with unique name", () => {
    ExerciseRepository.getAll();
    const hack = ExerciseService.getBySlug("hack-squat");
    expect(hack).not.toBeNull();

    const copy = ExerciseService.duplicate(hack!.id);
    expect(copy).not.toBeNull();
    expect(copy!.nameEs).toBe("Hack squat (copia)");
    expect(copy!.isSeed).toBe(false);
    expect(copy!.status).toBe("active");
    expect(copy!.slug).not.toBe(hack!.slug);
    expect(copy!.recordingType).toBe(hack!.recordingType);
    expect(copy!.defaults).toEqual(hack!.defaults);
    expect(copy!.imagePath).toBe(hack!.imagePath);
    expect(copy!.primaryMuscle).toBe(hack!.primaryMuscle);

    const copy2 = ExerciseService.duplicate(hack!.id);
    expect(copy2!.nameEs).toBe("Hack squat (copia 2)");
  });

  it("deletes unused exercises and blocks seed with routine refs", () => {
    ExerciseRepository.getAll();
    const unused = ExerciseService.create({
      ...ExerciseService.defaultsForCreate("strength"),
      name: "Temporal",
      primaryMuscle: "Shoulders",
    });
    expect(ExerciseService.canDelete(unused.id)).toBe(true);
    expect(ExerciseService.delete(unused.id)).toBe(true);
    expect(ExerciseService.getById(unused.id)).toBeNull();

    const hack = ExerciseService.getBySlug("hack-squat");
    expect(hack).not.toBeNull();
    const refs = getExerciseReferences("hack-squat");
    expect(refs.usedInRoutines).toBeGreaterThan(0);
    expect(refs.canDelete).toBe(false);
    expect(ExerciseService.delete(hack!.id)).toBe(false);
  });

  it("validates rep max >= min and rest >= 0", () => {
    const bad = ExerciseService.validate({
      name: "Test",
      recordingType: "strength",
      primaryMuscle: "Chest",
      sets: "3",
      repMin: "12",
      repMax: "8",
      targetRir: "2",
      restSeconds: "-1",
      loadIncrement: "2.5",
      initialLoad: "20",
    });
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.errors.repMax).toBeTruthy();
      expect(bad.errors.restSeconds).toBeTruthy();
    }
  });
});
