"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { ExerciseThumb } from "@/components/exercises/ExerciseThumb";
import {
  EQUIPMENT_LABELS_ES,
  LOAD_TYPE_LABELS_ES,
  muscleLabelEs,
  RECORDING_TYPE_LABELS_ES,
  useExercises,
} from "@/features/exercises";
import {
  formatLastSessionDate,
  formatLoadDisplay,
} from "@/features/workout/WorkoutFormat";
import { WorkoutHistoryService } from "@/features/workout/WorkoutHistoryService";
import { cn } from "@/lib/utils/cn";

type ExerciseDetailScreenProps = {
  exerciseId: string;
};

export function ExerciseDetailScreen({ exerciseId }: ExerciseDetailScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { all, archive, restore, remove, duplicate, getReferences } =
    useExercises();
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const exercise = useMemo(
    () => all.find((item) => item.id === exerciseId) ?? null,
    [all, exerciseId],
  );

  const refs = useMemo(
    () => (exercise ? getReferences(exercise.id) : null),
    [exercise, getReferences, all],
  );

  const lastTraining = useMemo(() => {
    if (!hydrated || !exercise) return null;
    const recent = WorkoutHistoryService.getRecentExerciseHistory(
      exercise.slug,
      1,
    );
    const session = recent[0];
    if (!session) return null;
    const lastSet = session.sets[session.sets.length - 1];
    if (!lastSet) return null;
    return {
      dateLabel: formatLastSessionDate(session.sessionDate),
      setLine: formatLastSetSummary({
        load: lastSet.load,
        repetitions: lastSet.repetitions,
        durationSeconds: lastSet.durationSeconds,
        rir: lastSet.rir,
      }),
    };
  }, [hydrated, exercise]);

  const loadOrigin = useMemo(() => {
    if (!hydrated || !exercise) return null;
    const history = WorkoutHistoryService.getRecentExerciseHistory(
      exercise.slug,
      1,
    );
    if (history.length > 0) {
      return {
        label: "Última serie registrada",
        hint: "Al entrenar, la carga inicial sale de tu última serie.",
      };
    }
    if (exercise.defaults.initialLoad != null) {
      return {
        label: "Valor por defecto del ejercicio",
        hint: "Sin historial aún: se usa la carga inicial configurada aquí.",
      };
    }
    return {
      label: "Configuración personalizada",
      hint: "Sin serie previa ni carga por defecto: el entrenamiento parte de la configuración del ejercicio o de la rutina.",
    };
  }, [hydrated, exercise]);

  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!hydrated) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title="Ejercicio"
          onBack={() => router.push("/more/training/exercises")}
        />
        <div className="mx-auto mt-4 size-[120px] rounded-[24px] bg-surface/60" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="px-5 pt-2">
        <PageHeader title="Ejercicio" onBack={() => router.push("/more/training/exercises")} />
        <p className="mt-8 text-center text-body text-text-secondary">
          No se encontró este ejercicio en tu biblioteca.
        </p>
      </div>
    );
  }

  const current = exercise;
  const canDelete = refs?.canDelete ?? false;

  function confirmHardDelete() {
    const ok = remove(current.id);
    setConfirmDelete(false);
    if (ok) {
      showToast("Ejercicio eliminado", "danger");
      router.push("/more/training/exercises");
    }
  }

  function confirmArchiveAction() {
    archive(current.id);
    setConfirmArchive(false);
    showToast("Ejercicio archivado", "default");
  }

  function handleRestore() {
    restore(current.id);
    setMenuOpen(false);
    showToast("Ejercicio restaurado", "success");
  }

  function handleDuplicate() {
    const copy = duplicate(current.id);
    setMenuOpen(false);
    if (!copy) {
      showToast("No se pudo duplicar", "danger");
      return;
    }
    showToast("Ejercicio duplicado", "success");
    router.push(`/more/training/exercises/${copy.id}`);
  }

  const d = current.defaults;
  const usageLine = formatUsageLine(refs);

  return (
    <div className="relative min-h-dvh pb-[max(32px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title={current.nameEs}
          onBack={() => router.push("/more/training/exercises")}
          action={
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="Más opciones"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex size-[44px] items-center justify-center rounded-[12px] text-text-primary hover:bg-surface-secondary/80"
              >
                <MoreHorizontal size={22} strokeWidth={2} />
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+6px)] z-20 min-w-[220px] overflow-hidden rounded-[16px] bg-surface py-1.5 shadow-m ring-1 ring-black/[0.06]"
                >
                  <MenuItem
                    icon={Pencil}
                    label="Editar"
                    onClick={() => {
                      setMenuOpen(false);
                      router.push(
                        `/more/training/exercises/${current.id}/edit`,
                      );
                    }}
                  />
                  <MenuItem
                    icon={Copy}
                    label="Duplicar"
                    onClick={handleDuplicate}
                  />
                  {current.status === "active" ? (
                    <MenuItem
                      icon={Archive}
                      label="Archivar"
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmArchive(true);
                      }}
                    />
                  ) : (
                    <MenuItem
                      icon={ArchiveRestore}
                      label="Restaurar"
                      onClick={handleRestore}
                    />
                  )}
                  {canDelete ? (
                    <>
                      <div
                        aria-hidden
                        className="my-1.5 border-t border-border/70"
                      />
                      <MenuItem
                        icon={Trash2}
                        label="Eliminar definitivamente"
                        tone="danger"
                        onClick={() => {
                          setMenuOpen(false);
                          setConfirmDelete(true);
                        }}
                      />
                    </>
                  ) : null}
                </div>
              ) : null}
            </div>
          }
        />

        <ExerciseThumb
          imagePath={current.imagePath}
          alt={current.nameEs}
          size="lg"
          className="mt-3"
        />

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-text-primary px-3 py-1 text-[12px] font-semibold text-surface">
            {RECORDING_TYPE_LABELS_ES[current.recordingType]}
          </span>
          <span className="rounded-full bg-surface-secondary px-3 py-1 text-[12px] font-semibold text-text-secondary">
            {current.status === "active" ? "Activo" : "Archivado"}
          </span>
          {current.isSeed ? (
            <span className="rounded-full bg-primary/25 px-3 py-1 text-[12px] font-semibold text-text-primary">
              Sistema · Incluido en TRAZA
            </span>
          ) : (
            <span className="rounded-full bg-surface-secondary px-3 py-1 text-[12px] font-semibold text-text-secondary">
              Creado por ti · Personal
            </span>
          )}
        </div>

        <section className="mt-5 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
          <p className="text-[13px] leading-snug text-text-secondary">
            {usageLine}
          </p>
          {lastTraining ? (
            <p className="mt-2.5 text-[14px] font-semibold text-text-primary">
              Último entrenamiento · {lastTraining.dateLabel}
              <span className="mt-0.5 block text-[13px] font-medium text-text-secondary">
                {lastTraining.setLine}
              </span>
            </p>
          ) : (
            <p className="mt-2.5 text-[13px] text-text-muted">
              Aún no aparece en ningún entrenamiento.
            </p>
          )}
        </section>

        {loadOrigin ? (
          <section className="mt-3 rounded-[20px] bg-surface/80 px-4 py-3 ring-1 ring-black/[0.03]">
            <h2 className="text-label font-medium uppercase tracking-label text-text-muted">
              Carga al entrenar
            </h2>
            <p className="mt-1.5 text-[14px] font-semibold text-text-primary">
              {loadOrigin.label}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-text-secondary">
              {loadOrigin.hint}
            </p>
          </section>
        ) : null}

        <section className="mt-5">
          <h2 className="text-label font-medium uppercase tracking-label text-text-muted">
            Clasificación
          </h2>
          <dl className="mt-3 space-y-2.5 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
            <DetailRow
              label="Músculo principal"
              value={muscleLabelEs(current.primaryMuscle)}
            />
            {current.secondaryMuscles.length > 0 ? (
              <DetailRow
                label="Secundarios"
                value={current.secondaryMuscles
                  .map(muscleLabelEs)
                  .join(", ")}
              />
            ) : null}
            {current.equipment ? (
              <DetailRow
                label="Material"
                value={
                  EQUIPMENT_LABELS_ES[current.equipment] ?? current.equipment
                }
              />
            ) : null}
            <DetailRow
              label="Carga"
              value={LOAD_TYPE_LABELS_ES[current.loadType] ?? current.loadType}
            />
          </dl>
        </section>

        <section className="mt-5">
          <h2 className="text-label font-medium uppercase tracking-label text-text-muted">
            Valores por defecto
          </h2>
          <dl className="mt-3 space-y-2.5 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
            <DetailRow label="Series" value={String(d.sets)} />
            {d.repMin != null && d.repMax != null ? (
              <DetailRow label="Reps" value={`${d.repMin}–${d.repMax}`} />
            ) : null}
            {d.targetRir != null ? (
              <DetailRow label="RIR objetivo" value={String(d.targetRir)} />
            ) : null}
            <DetailRow label="Descanso" value={`${d.restSeconds} s`} />
            {d.initialLoad != null ? (
              <DetailRow
                label="Carga inicial"
                value={`${formatLoadDisplay(d.initialLoad)} ${d.loadUnit}`}
              />
            ) : null}
            <DetailRow
              label="Incremento"
              value={`${formatLoadDisplay(d.loadIncrement)} ${d.loadUnit}`}
            />
          </dl>
        </section>
      </div>

      <ConfirmationDialog
        open={confirmArchive}
        title="¿Archivar ejercicio?"
        description="Dejará de aparecer en selectores nuevos. El historial se conserva y podrás restaurarlo."
        confirmLabel="Archivar"
        tone="neutral"
        onConfirm={confirmArchiveAction}
        onCancel={() => setConfirmArchive(false)}
      />

      <ConfirmationDialog
        open={confirmDelete}
        title="¿Eliminar definitivamente?"
        description="Esta acción es irreversible. Solo es posible porque el ejercicio no tiene historial ni rutinas asociadas."
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={confirmHardDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  tone = "default",
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-[15px] font-medium transition-colors",
        tone === "danger"
          ? "text-danger hover:bg-danger/10"
          : "text-text-primary hover:bg-surface-secondary/80",
      )}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0 opacity-80" />
      {label}
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[13px] text-text-secondary">{label}</dt>
      <dd className="text-right text-[14px] font-semibold text-text-primary">
        {value}
      </dd>
    </div>
  );
}

function formatUsageLine(
  refs: {
    usedInRoutines: number;
    usedInWorkoutSessions: number;
    workoutSets: number;
    personalRecords: number;
  } | null,
): string {
  const routines = refs?.usedInRoutines ?? 0;
  const sessions = refs?.usedInWorkoutSessions ?? 0;
  const sets = refs?.workoutSets ?? 0;
  const prs = refs?.personalRecords ?? 0;

  return [
    "Utilizado en",
    pluralEs(routines, "rutina", "rutinas"),
    pluralEs(sessions, "entrenamiento", "entrenamientos"),
    pluralEs(sets, "serie", "series"),
    pluralEs(prs, "récord personal", "récords personales"),
  ].join(" · ");
}

function pluralEs(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function formatLastSetSummary(set: {
  load: number | null;
  repetitions: number | null;
  durationSeconds: number | null;
  rir: number | null;
}): string {
  if (set.durationSeconds != null) {
    return `${set.durationSeconds} s`;
  }
  const parts: string[] = [];
  if (set.load != null && set.repetitions != null) {
    parts.push(`${formatLoadDisplay(set.load)} kg × ${set.repetitions}`);
  } else {
    if (set.load != null) parts.push(`${formatLoadDisplay(set.load)} kg`);
    if (set.repetitions != null) parts.push(`${set.repetitions} reps`);
  }
  if (set.rir != null) parts.push(`RIR ${set.rir}`);
  return parts.length > 0 ? parts.join(" · ") : "—";
}
