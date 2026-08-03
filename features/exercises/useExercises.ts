"use client";

import { useCallback, useMemo } from "react";
import { useRepositoryEntries } from "@/lib/tracking/useRepositoryEntries";
import { ExerciseRepository } from "./exerciseRepository";
import { ExerciseService } from "./exerciseService";
import type {
  Exercise,
  ExerciseFilters,
  ExerciseInput,
  ExerciseReferenceSummary,
  RecordingType,
  StructuralChangeWarning,
} from "./exerciseTypes";

const EMPTY: Exercise[] = [];

export function useExercises(filters?: ExerciseFilters) {
  const all = useRepositoryEntries(ExerciseRepository, "exercises", EMPTY);

  const exercises = useMemo(
    () => ExerciseService.search(filters ?? {}),
    [all, filters?.query, filters?.status, filters?.recordingType, filters?.primaryMuscle],
  );

  const active = useMemo(
    () => all.filter((item) => item.status === "active"),
    [all],
  );

  const archived = useMemo(
    () => all.filter((item) => item.status === "archived"),
    [all],
  );

  const create = useCallback((input: ExerciseInput) => {
    return ExerciseService.create(input);
  }, []);

  const update = useCallback((id: string, input: ExerciseInput) => {
    return ExerciseService.update(id, input);
  }, []);

  const archive = useCallback((id: string) => {
    return ExerciseService.archive(id);
  }, []);

  const restore = useCallback((id: string) => {
    return ExerciseService.restore(id);
  }, []);

  const duplicate = useCallback((id: string) => {
    return ExerciseService.duplicate(id);
  }, []);

  const remove = useCallback((id: string) => {
    return ExerciseService.delete(id);
  }, []);

  const getById = useCallback((id: string) => {
    return ExerciseService.getById(id);
  }, []);

  const getReferences = useCallback((id: string): ExerciseReferenceSummary | null => {
    return ExerciseService.getReferences(id);
  }, []);

  const assessStructuralChange = useCallback(
    (id: string, nextType: RecordingType): StructuralChangeWarning | null => {
      return ExerciseService.assessStructuralChange(id, nextType);
    },
    [],
  );

  return {
    all,
    exercises,
    active,
    archived,
    create,
    update,
    archive,
    restore,
    duplicate,
    remove,
    getById,
    getReferences,
    assessStructuralChange,
  };
}
