import { trainingStorage } from "@/lib/storage/trainingStorage";
import { RoutineRepository } from "./routineRepository";
import type {
  RoutineLivingStats,
  RoutineRecentSession,
  RoutineReferenceSummary,
} from "./routineTypes";

/**
 * Where a routine (by slug / id) is referenced in workout history.
 * Completed sessions are the gate for version-save dialog.
 */
export function getRoutineReferences(
  routineIdOrSlug: string,
): RoutineReferenceSummary {
  const routine =
    RoutineRepository.getById(routineIdOrSlug) ??
    RoutineRepository.getBySlug(routineIdOrSlug);

  const slug = routine?.slug ?? routineIdOrSlug;
  const versionIds = new Set(
    routine
      ? RoutineRepository.getVersionsForRoutine(routine.id).map((v) => v.id)
      : [],
  );

  const sessions = trainingStorage.getSessions();
  let completedSessions = 0;
  let inProgressSessions = 0;
  let totalSessions = 0;

  for (const session of sessions) {
    const byTemplate = session.templateId === slug;
    const byVersion =
      session.templateVersionId != null &&
      versionIds.has(session.templateVersionId);
    if (!byTemplate && !byVersion) continue;

    totalSessions += 1;
    if (session.status === "in_progress") {
      inProgressSessions += 1;
    } else if (
      session.status === "completed" ||
      session.status === "partial"
    ) {
      completedSessions += 1;
    }
  }

  return {
    completedSessions,
    inProgressSessions,
    totalSessions,
    hasCompletedHistory: completedSessions > 0,
    canHardDelete: totalSessions === 0,
  };
}

export function hasCompletedRoutineHistory(routineIdOrSlug: string): boolean {
  return getRoutineReferences(routineIdOrSlug).hasCompletedHistory;
}

function matchesRoutine(
  session: {
    templateId: string | null;
    templateVersionId: string | null;
  },
  slug: string,
  versionIds: Set<string>,
): boolean {
  const byTemplate = session.templateId === slug;
  const byVersion =
    session.templateVersionId != null &&
    versionIds.has(session.templateVersionId);
  return byTemplate || byVersion;
}

/**
 * Newest finished sessions for this routine (detail “Últimos entrenamientos”).
 */
export function getRecentRoutineSessions(
  routineIdOrSlug: string,
  limit = 5,
): RoutineRecentSession[] {
  const routine =
    RoutineRepository.getById(routineIdOrSlug) ??
    RoutineRepository.getBySlug(routineIdOrSlug);
  const slug = routine?.slug ?? routineIdOrSlug;
  const versionIds = new Set(
    routine
      ? RoutineRepository.getVersionsForRoutine(routine.id).map((v) => v.id)
      : [],
  );

  return trainingStorage
    .getSessions()
    .filter((session) => {
      if (!matchesRoutine(session, slug, versionIds)) return false;
      return session.status === "completed" || session.status === "partial";
    })
    .sort((a, b) => {
      const byDate = b.sessionDate.localeCompare(a.sessionDate);
      if (byDate !== 0) return byDate;
      return (b.endTime ?? b.updatedAt).localeCompare(a.endTime ?? a.updatedAt);
    })
    .slice(0, Math.max(0, limit))
    .map((session) => ({
      sessionId: session.id,
      sessionDate: session.sessionDate,
      durationMinutes:
        typeof session.durationMinutes === "number" &&
        Number.isFinite(session.durationMinutes)
          ? session.durationMinutes
          : null,
    }));
}

/**
 * Living-program stats for detail: last session, counts, averages.
 * Only finished sessions (completed / partial) contribute.
 */
export function getRoutineLivingStats(
  routineIdOrSlug: string,
): RoutineLivingStats {
  const routine =
    RoutineRepository.getById(routineIdOrSlug) ??
    RoutineRepository.getBySlug(routineIdOrSlug);
  const slug = routine?.slug ?? routineIdOrSlug;
  const versionIds = new Set(
    routine
      ? RoutineRepository.getVersionsForRoutine(routine.id).map((v) => v.id)
      : [],
  );

  const sessions = trainingStorage.getSessions().filter((session) => {
    if (!matchesRoutine(session, slug, versionIds)) return false;
    return session.status === "completed" || session.status === "partial";
  });

  if (sessions.length === 0) {
    return {
      completedSessions: 0,
      lastSessionDate: null,
      averageDurationMinutes: null,
      averageVolumeKg: null,
    };
  }

  let durationSum = 0;
  let durationCount = 0;
  let volumeSum = 0;
  let volumeCount = 0;
  let lastSessionDate: string | null = null;
  let lastSessionSortKey = "";

  for (const session of sessions) {
    const sortKey = `${session.sessionDate}|${session.endTime ?? session.startTime ?? ""}`;
    if (!lastSessionDate || sortKey > lastSessionSortKey) {
      lastSessionDate = session.sessionDate;
      lastSessionSortKey = sortKey;
    }

    if (
      typeof session.durationMinutes === "number" &&
      Number.isFinite(session.durationMinutes) &&
      session.durationMinutes > 0
    ) {
      durationSum += session.durationMinutes;
      durationCount += 1;
    }

    let sessionVolume = 0;
    let hasVolume = false;
    for (const exercise of session.exercises) {
      for (const set of exercise.sets) {
        if (
          typeof set.load === "number" &&
          typeof set.repetitions === "number" &&
          Number.isFinite(set.load) &&
          Number.isFinite(set.repetitions)
        ) {
          sessionVolume += set.load * set.repetitions;
          hasVolume = true;
        }
      }
    }
    if (hasVolume) {
      volumeSum += sessionVolume;
      volumeCount += 1;
    }
  }

  return {
    completedSessions: sessions.length,
    lastSessionDate,
    averageDurationMinutes:
      durationCount > 0 ? Math.round(durationSum / durationCount) : null,
    averageVolumeKg:
      volumeCount > 0 ? Math.round(volumeSum / volumeCount) : null,
  };
}
