"use client";

import { useCallback, useMemo } from "react";
import { useRepositoryEntries } from "@/lib/tracking/useRepositoryEntries";
import { RoutineRepository } from "./routineRepository";
import { getRecentRoutineSessions } from "./routineReferences";
import { RoutineService } from "./routineService";
import type {
  Routine,
  RoutineDuplicateOptions,
  RoutineFilters,
  RoutineInput,
  RoutineLivingStats,
  RoutineRecentSession,
  RoutineReferenceSummary,
  RoutineUpdateOptions,
  RoutineWithVersion,
  VersionDecision,
} from "./routineTypes";

const EMPTY: Routine[] = [];

export function useRoutines(filters?: RoutineFilters) {
  const all = useRepositoryEntries(RoutineRepository, "routines", EMPTY);

  const routines = useMemo(
    () => RoutineService.search(filters ?? {}),
    [all, filters?.query, filters?.status],
  );

  const active = useMemo(
    () => all.filter((item) => item.status === "active"),
    [all],
  );

  const archived = useMemo(
    () => all.filter((item) => item.status === "archived"),
    [all],
  );

  const create = useCallback((input: RoutineInput) => {
    return RoutineService.create(input);
  }, []);

  const update = useCallback(
    (id: string, input: RoutineInput, options?: RoutineUpdateOptions) => {
      return RoutineService.update(id, input, options);
    },
    [],
  );

  const archive = useCallback((id: string) => {
    return RoutineService.archive(id);
  }, []);

  const restore = useCallback((id: string) => {
    return RoutineService.restore(id);
  }, []);

  const activate = useCallback((id: string) => {
    return RoutineService.activate(id);
  }, []);

  const duplicate = useCallback(
    (id: string, options?: Partial<RoutineDuplicateOptions>) => {
      return RoutineService.duplicate(id, options);
    },
    [],
  );

  const remove = useCallback((id: string) => {
    return RoutineService.delete(id);
  }, []);

  const getById = useCallback((id: string) => {
    return RoutineService.getById(id);
  }, []);

  const getWithCurrentVersion = useCallback(
    (id: string): RoutineWithVersion | null => {
      return RoutineService.getWithCurrentVersion(id);
    },
    [],
  );

  const getReferences = useCallback(
    (id: string): RoutineReferenceSummary => {
      return RoutineService.getReferences(id);
    },
    [],
  );

  const getLivingStats = useCallback(
    (id: string): RoutineLivingStats => {
      return RoutineService.getLivingStats(id);
    },
    [],
  );

  const getRecentSessions = useCallback(
    (id: string, limit = 5): RoutineRecentSession[] => {
      return getRecentRoutineSessions(id, limit);
    },
    [],
  );

  const assessUpdate = useCallback(
    (
      id: string,
      input: RoutineInput,
    ): VersionDecision & {
      structural: boolean;
      needsVersionChoice: boolean;
    } => {
      return RoutineService.assessUpdate(id, input);
    },
    [],
  );

  return {
    all,
    routines,
    active,
    archived,
    create,
    update,
    archive,
    restore,
    activate,
    duplicate,
    remove,
    getById,
    getWithCurrentVersion,
    getReferences,
    getLivingStats,
    getRecentSessions,
    assessUpdate,
  };
}
