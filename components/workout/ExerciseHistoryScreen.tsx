"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { PrimaryButton } from "@/components/forms/Button";
import {
  PRService,
  WorkoutCatalog,
  WorkoutHistoryService,
  formatHistorySessionDate,
  formatLoadDisplay,
  formatVolumeKg,
  type ExerciseHistorySession,
  type ExerciseHistorySummary,
  type PersonalRecordKind,
} from "@/features/workout";
import { fadeSlideVariants, motionDuration, motionEase } from "@/lib/motion";

type ExerciseHistoryScreenProps = {
  exerciseId: string;
};

function formatSetCells(set: ExerciseHistorySession["sets"][number]): string {
  if (set.durationSeconds != null) {
    return `${set.durationSeconds} s`;
  }
  const parts: string[] = [];
  if (set.load != null) parts.push(`${formatLoadDisplay(set.load)} kg`);
  if (set.repetitions != null) parts.push(`${set.repetitions} reps`);
  if (set.rir != null) parts.push(`RIR ${set.rir}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function PrChip({ kind }: { kind: PersonalRecordKind }) {
  return (
    <span className="rounded-[6px] bg-text-primary/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-text-muted">
      {PRService.labelEs(kind)}
    </span>
  );
}

export function ExerciseHistoryScreen({
  exerciseId,
}: ExerciseHistoryScreenProps) {
  const router = useRouter();
  const catalog = WorkoutCatalog.getExercise(exerciseId);
  // Gate storage + relative dates until after mount / exerciseId load.
  // readyForId avoids SSR/client mismatch and stale data on id change.
  const [readyForId, setReadyForId] = useState<string | null>(null);
  const [history, setHistory] = useState<ExerciseHistorySession[]>([]);
  const [summary, setSummary] = useState<ExerciseHistorySummary | null>(null);
  const hydrated = readyForId === exerciseId;

  useEffect(() => {
    setHistory(WorkoutHistoryService.getExerciseHistory(exerciseId));
    setSummary(WorkoutHistoryService.getExerciseSummary(exerciseId));
    setReadyForId(exerciseId);
  }, [exerciseId]);

  if (!catalog) {
    return (
      <div className="px-5 pt-safe">
        <PageHeader title="Historial" onBack={() => router.back()} />
        <p className="mt-8 text-body text-text-secondary">
          No encontramos ese ejercicio.
        </p>
        <PrimaryButton className="mt-6" onClick={() => router.push("/train")}>
          Volver a Entrenar
        </PrimaryButton>
      </div>
    );
  }

  return (
    <motion.div
      className="flex min-h-dvh flex-col bg-[linear-gradient(180deg,#f7f8f3_0%,#eef1e8_48%,#f3f4ef_100%)] px-5 pb-safe pt-safe"
      variants={fadeSlideVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader title={catalog.nameEs} onBack={() => router.back()} />

      <div className="mt-2 flex items-center gap-3">
        <div className="relative h-[56px] w-[48px] shrink-0">
          <Image
            src={catalog.image}
            alt=""
            fill
            sizes="48px"
            className="object-contain"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="text-label font-medium uppercase tracking-label text-text-muted">
            Historial
          </p>
          <p className="text-[15px] text-text-secondary">
            {hydrated && summary
              ? summary.sessionCount === 0
                ? "Sin sesiones todavía"
                : summary.sessionCount === 1
                  ? "1 sesión"
                  : `${summary.sessionCount} sesiones`
              : "…"}
          </p>
        </div>
      </div>

      {hydrated && summary && summary.sessionCount > 0 ? (
        <div className="mt-5 grid grid-cols-3 gap-2">
          <SummaryPill
            label="Mejor carga"
            value={
              summary.bestLoad != null
                ? `${formatLoadDisplay(summary.bestLoad)} kg`
                : "—"
            }
          />
          <SummaryPill
            label="Más reps"
            value={
              summary.bestReps != null ? String(summary.bestReps) : "—"
            }
          />
          <SummaryPill
            label="Volumen"
            value={
              summary.totalVolumeKg > 0
                ? `${formatVolumeKg(summary.totalVolumeKg)} kg`
                : "—"
            }
          />
        </div>
      ) : null}

      <div className="mt-6 min-h-0 flex-1 space-y-3 overflow-y-auto pb-8">
        {!hydrated ? (
          <div className="space-y-2">
            <div className="h-[88px] animate-pulse rounded-[16px] bg-surface/70" />
            <div className="h-[88px] animate-pulse rounded-[16px] bg-surface/70" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-text-secondary">
            Cuando registres series, aparecerán aquí.
          </p>
        ) : (
          history.map((session, index) => (
            <motion.article
              key={session.sessionId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: motionDuration.fast,
                ease: motionEase.standard,
                delay: Math.min(index * 0.03, 0.18),
              }}
              className="rounded-[16px] bg-surface/85 px-3.5 py-3 ring-1 ring-border-light/70"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-text-primary">
                    {formatHistorySessionDate(session.sessionDate)}
                  </p>
                  {session.routineNameEs ? (
                    <p className="text-[12px] text-text-muted">
                      {session.routineNameEs}
                    </p>
                  ) : null}
                </div>
                {session.volumeKg > 0 ? (
                  <p className="shrink-0 text-[12px] tabular-nums text-text-muted">
                    {formatVolumeKg(session.volumeKg)} kg vol
                  </p>
                ) : null}
              </div>

              <ul className="mt-2.5 space-y-1.5">
                {session.sets.map((set) => (
                  <li
                    key={set.setId}
                    className="flex items-center gap-2 text-[13px] leading-snug"
                  >
                    <span className="w-[28px] shrink-0 text-text-muted tabular-nums">
                      S{set.setNumber}
                    </span>
                    <span className="min-w-0 flex-1 tabular-nums text-text-primary">
                      {formatSetCells(set)}
                    </span>
                    {set.volumeKg > 0 ? (
                      <span className="shrink-0 text-[11px] tabular-nums text-text-muted">
                        {formatVolumeKg(set.volumeKg)}
                      </span>
                    ) : null}
                    {set.prKinds.length > 0 ? (
                      <span className="flex shrink-0 gap-1">
                        {set.prKinds.slice(0, 1).map((kind) => (
                          <PrChip key={kind} kind={kind} />
                        ))}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </motion.article>
          ))
        )}
      </div>
    </motion.div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-surface/80 px-2.5 py-2.5 ring-1 ring-border-light/60">
      <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-text-muted">
        {label}
      </p>
      <p className="mt-0.5 text-[14px] font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  );
}
