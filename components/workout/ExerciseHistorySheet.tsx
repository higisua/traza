"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "@/components/navigation/BottomSheet";
import {
  PRService,
  WorkoutHistoryService,
  formatHistorySessionDate,
  formatLoadDisplay,
  formatVolumeKg,
  type ExerciseHistorySession,
} from "@/features/workout";

type ExerciseHistorySheetProps = {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
};

function formatSetLine(set: ExerciseHistorySession["sets"][number]): string {
  if (set.durationSeconds != null) return `${set.durationSeconds} s`;
  const parts: string[] = [];
  if (set.load != null) parts.push(`${formatLoadDisplay(set.load)} kg`);
  if (set.repetitions != null) parts.push(`${set.repetitions}`);
  if (set.rir != null) parts.push(`RIR ${set.rir}`);
  return parts.join(" · ") || "—";
}

/**
 * Quick history during an active workout — does not leave the session.
 * Storage + relative dates only after open+effect (never on first paint).
 */
export function ExerciseHistorySheet({
  open,
  onClose,
  exerciseId,
  exerciseName,
}: ExerciseHistorySheetProps) {
  const [rows, setRows] = useState<ExerciseHistorySession[]>([]);
  const [readyForId, setReadyForId] = useState<string | null>(null);
  const ready = open && readyForId === exerciseId;

  useEffect(() => {
    if (!open) {
      setReadyForId(null);
      setRows([]);
      return;
    }
    setRows(WorkoutHistoryService.getRecentExerciseHistory(exerciseId, 6));
    setReadyForId(exerciseId);
  }, [open, exerciseId]);

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Historial · ${exerciseName}`}
      className="max-h-[min(72dvh,640px)] overflow-hidden"
    >
      <div className="max-h-[min(56dvh,520px)] overflow-y-auto pb-1">
        {!ready ? (
          <div className="space-y-2 py-2">
            <div className="h-[72px] animate-pulse rounded-[14px] bg-surface-secondary/60" />
            <div className="h-[72px] animate-pulse rounded-[14px] bg-surface-secondary/60" />
          </div>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-[14px] text-text-secondary">
            Aún no hay historial de este ejercicio.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((session) => (
              <li
                key={session.sessionId}
                className="rounded-[14px] bg-surface-secondary/50 px-3 py-2.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-text-primary">
                      {formatHistorySessionDate(session.sessionDate)}
                    </p>
                    {session.routineNameEs ? (
                      <p className="text-[11px] text-text-muted">
                        {session.routineNameEs}
                      </p>
                    ) : null}
                  </div>
                  {session.volumeKg > 0 ? (
                    <p className="text-[11px] tabular-nums text-text-muted">
                      {formatVolumeKg(session.volumeKg)} kg
                    </p>
                  ) : null}
                </div>
                <ul className="mt-1.5 space-y-1">
                  {session.sets.map((set) => (
                    <li
                      key={set.setId}
                      className="flex items-center gap-2 text-[13px] tabular-nums text-text-secondary"
                    >
                      <span className="w-[24px] text-text-muted">
                        S{set.setNumber}
                      </span>
                      <span className="min-w-0 flex-1 text-text-primary">
                        {formatSetLine(set)}
                      </span>
                      {set.prKinds[0] ? (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-text-muted">
                          {PRService.labelEs(set.prKinds[0])}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  );
}
