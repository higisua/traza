"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Copy,
  MoreHorizontal,
  Pencil,
  Play,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { PrimaryButton, SecondaryButton } from "@/components/forms/Button";
import {
  DEFAULT_ROUTINE_DUPLICATE_OPTIONS,
  RoutineService,
  useRoutines,
  type RoutineDuplicateOptions,
} from "@/features/routines";
import {
  WorkoutCatalog,
  formatApproxDuration,
  formatExerciseCount,
  formatHistorySessionDate,
  formatLastSessionDate,
  formatRepRange,
  formatVolumeKg,
} from "@/features/workout";
import { cn } from "@/lib/utils/cn";

type RoutineDetailScreenProps = {
  routineId: string;
};

export function RoutineDetailScreen({ routineId }: RoutineDetailScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const {
    all,
    archive,
    restore,
    remove,
    duplicate,
    getReferences,
    getLivingStats,
    getRecentSessions,
  } = useRoutines();
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateOpts, setDuplicateOpts] = useState<RoutineDuplicateOptions>(
    DEFAULT_ROUTINE_DUPLICATE_OPTIONS,
  );

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

  const routine = useMemo(
    () => all.find((item) => item.id === routineId) ?? null,
    [all, routineId],
  );

  const version = useMemo(() => {
    if (!routine) return null;
    return RoutineService.getWithCurrentVersion(routine.id)?.version ?? null;
  }, [routine, all]);

  const refs = useMemo(
    () => (routine ? getReferences(routine.id) : null),
    [routine, getReferences, all],
  );

  const living = useMemo(
    () => (routine ? getLivingStats(routine.id) : null),
    [routine, getLivingStats, all],
  );

  const recentSessions = useMemo(
    () => (routine ? getRecentSessions(routine.id, 5) : []),
    [routine, getRecentSessions, all],
  );

  if (!hydrated) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title="Rutina"
          onBack={() => router.push("/more/training/routines")}
        />
        <div className="mt-6 h-[120px] rounded-[20px] bg-surface/60" />
      </div>
    );
  }

  if (!routine || !version) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title="Rutina"
          onBack={() => router.push("/more/training/routines")}
        />
        <p className="mt-8 text-center text-body text-text-secondary">
          No se encontró esta rutina.
        </p>
      </div>
    );
  }

  const current = routine;
  const isActive = current.status === "active";

  function confirmHardDelete() {
    const result = remove(current.id);
    setConfirmDelete(false);
    if (result.ok) {
      showToast("Rutina eliminada", "danger");
      router.push("/more/training/routines");
    } else {
      showToast(result.reason, "danger");
    }
  }

  function confirmArchiveAction() {
    archive(current.id);
    setConfirmArchive(false);
    showToast("Rutina archivada", "default");
  }

  function handleRestore() {
    restore(current.id);
    setMenuOpen(false);
    showToast("Rutina restaurada · ya aparece en Entrenar", "success");
  }

  function openDuplicate() {
    setMenuOpen(false);
    setDuplicateOpts(DEFAULT_ROUTINE_DUPLICATE_OPTIONS);
    setDuplicateOpen(true);
  }

  function confirmDuplicate() {
    if (!duplicateOpts.exercises) {
      showToast("Marca al menos Ejercicios para duplicar", "danger");
      return;
    }
    const copy = duplicate(current.id, duplicateOpts);
    setDuplicateOpen(false);
    if (!copy) {
      showToast("No se pudo duplicar", "danger");
      return;
    }
    showToast("Rutina duplicada", "success");
    router.push(`/more/training/routines/${copy.id}`);
  }

  function startTraining() {
    if (!isActive) {
      showToast("Restaura la rutina para entrenar con ella", "default");
      return;
    }
    router.push(`/train/${current.slug}`);
  }

  return (
    <div className="relative min-h-dvh pb-[max(32px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title={current.nameEs}
          onBack={() => router.push("/more/training/routines")}
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
                        `/more/training/routines/${current.id}/edit`,
                      );
                    }}
                  />
                  <MenuItem
                    icon={Copy}
                    label="Duplicar"
                    onClick={openDuplicate}
                  />
                  {isActive ? (
                    <MenuItem
                      icon={Play}
                      label="Iniciar entrenamiento"
                      onClick={() => {
                        setMenuOpen(false);
                        startTraining();
                      }}
                    />
                  ) : null}
                  {isActive ? (
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
                  {refs?.canHardDelete ? (
                    <MenuItem
                      icon={Trash2}
                      label="Eliminar"
                      danger
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                      }}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
          }
        />

        <div className="mt-4 overflow-hidden rounded-[24px] bg-surface p-5 shadow-xs ring-1 ring-black/[0.03]">
          <div className="min-w-0">
            <p className="text-label font-medium uppercase tracking-label text-text-muted">
              Programa
            </p>
            <h2 className="mt-1 text-[22px] font-bold tracking-[-0.02em] text-text-primary">
              {current.nameEs}
            </h2>
            {current.description ? (
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                {current.description}
              </p>
            ) : null}
            {current.goal ? (
              <p className="mt-3 text-[13px] font-medium text-text-primary">
                Objetivo · {current.goal}
              </p>
            ) : null}
          </div>

          <div
            className={cn(
              "mt-4 rounded-[16px] px-3.5 py-3",
              isActive ? "bg-primary/20" : "bg-surface-secondary/90",
            )}
          >
            <p className="text-[14px] font-semibold text-text-primary">
              {isActive ? "Activa" : "Archivada"}
            </p>
            <p className="mt-0.5 text-[13px] text-text-secondary">
              {isActive
                ? "Disponible en Entrenar"
                : "Conserva histórico, no aparece en Entrenar"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <MetaChip
              label="Ejercicios"
              value={String(version.exerciseCount)}
            />
            <MetaChip
              label="Duración"
              value={formatApproxDuration(version.estimatedDurationMinutes)}
            />
          </div>

          <div className="mt-4 border-t border-border/50 pt-4">
            {living && living.completedSessions > 0 ? (
              <ul className="space-y-2">
                {living.lastSessionDate ? (
                  <LivingRow
                    label="Último entrenamiento"
                    value={formatLastSessionDate(living.lastSessionDate)}
                  />
                ) : null}
                <LivingRow
                  label="Entrenamientos realizados"
                  value={String(living.completedSessions)}
                />
                {living.averageDurationMinutes != null ? (
                  <LivingRow
                    label="Duración media"
                    value={`${living.averageDurationMinutes} min`}
                  />
                ) : null}
                {living.averageVolumeKg != null && living.averageVolumeKg > 0 ? (
                  <LivingRow
                    label="Volumen medio"
                    value={`${formatVolumeKg(living.averageVolumeKg)} kg`}
                  />
                ) : null}
              </ul>
            ) : (
              <p className="text-[13px] text-text-muted">Nunca entrenada</p>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {isActive ? (
            <PrimaryButton className="flex-1" onClick={startTraining}>
              Iniciar entrenamiento
            </PrimaryButton>
          ) : (
            <PrimaryButton className="flex-1" onClick={handleRestore}>
              Restaurar
            </PrimaryButton>
          )}
          <SecondaryButton
            className="flex-1"
            onClick={() =>
              router.push(`/more/training/routines/${current.id}/edit`)
            }
          >
            Editar
          </SecondaryButton>
        </div>

        {recentSessions.length > 0 ? (
          <section className="mt-8">
            <h3 className="text-label font-medium uppercase tracking-label text-text-muted">
              Últimos entrenamientos
            </h3>
            <ul className="mt-3 flex flex-col gap-2">
              {recentSessions.map((session) => (
                <li key={session.sessionId}>
                  <Link
                    href={`/workout/${session.sessionId}/summary`}
                    className="flex items-center justify-between gap-3 rounded-[16px] bg-surface px-3.5 py-3 shadow-xs ring-1 ring-black/[0.03] transition-transform active:scale-[0.99]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-text-primary">
                        {formatHistorySessionDate(session.sessionDate)}
                      </span>
                      {session.durationMinutes != null ? (
                        <span className="mt-0.5 block text-[13px] text-text-secondary">
                          {session.durationMinutes} min
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[13px] font-medium text-text-muted">
                      Ver
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <h3 className="mt-8 text-label font-medium uppercase tracking-label text-text-muted">
          Ejercicios · {formatExerciseCount(version.exerciseCount)}
        </h3>

        <ul className="mt-3 flex flex-col gap-2">
          {[...version.blocks]
            .sort((a, b) => a.order - b.order)
            .map((block) => {
              const exercise = WorkoutCatalog.getExercise(block.exerciseSlug);
              const range =
                block.repMin != null || block.repMax != null
                  ? formatRepRange(
                      block.repMin ?? block.repMax ?? 0,
                      block.repMax ?? block.repMin ?? 0,
                    )
                  : null;
              return (
                <li
                  key={block.id}
                  className="flex items-center gap-3 rounded-[18px] bg-surface px-3.5 py-3.5 shadow-xs ring-1 ring-black/[0.03]"
                >
                  <div className="relative size-[40px] shrink-0 overflow-hidden rounded-[12px] bg-surface-secondary/70">
                    {exercise ? (
                      <Image
                        src={exercise.image}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-contain p-0.5"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-text-primary">
                      {exercise?.nameEs ?? block.exerciseSlug}
                    </p>
                    <p className="mt-0.5 text-[13px] text-text-secondary">
                      {block.durationMinutes
                        ? `${block.durationMinutes} min`
                        : block.durationSeconds
                          ? `${block.durationSeconds} s`
                          : `${block.sets} series`}
                      {range ? (
                        <>
                          <span className="mx-1.5 text-text-muted/40">·</span>
                          {range}
                        </>
                      ) : null}
                      {block.restSeconds > 0 ? (
                        <>
                          <span className="mx-1.5 text-text-muted/40">·</span>
                          {block.restSeconds}s
                        </>
                      ) : null}
                    </p>
                    {block.comment ? (
                      <p className="mt-1 truncate text-[12px] text-text-muted">
                        {block.comment}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
        </ul>
      </div>

      <ConfirmationDialog
        open={confirmArchive}
        title="¿Archivar rutina?"
        description="Conserva el histórico y dejará de aparecer en Entrenar."
        confirmLabel="Archivar"
        tone="neutral"
        onConfirm={confirmArchiveAction}
        onCancel={() => setConfirmArchive(false)}
      />

      <ConfirmationDialog
        open={confirmDelete}
        title="¿Eliminar rutina?"
        description="Solo es posible si no hay entrenamientos vinculados. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={confirmHardDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <ConfirmationDialog
        open={duplicateOpen}
        title="Duplicar rutina"
        description="Elige qué copiar a la nueva rutina. Puedes afinar después."
        confirmLabel="Duplicar"
        cancelLabel="Cancelar"
        tone="neutral"
        onConfirm={confirmDuplicate}
        onCancel={() => setDuplicateOpen(false)}
      >
        <div className="mt-4 space-y-2.5">
          {(
            [
              ["exercises", "Ejercicios", "Lista y orden de la rutina"],
              ["configuration", "Configuración", "Series, reps, RIR e incremento"],
              ["rests", "Descansos", "Segundos entre series"],
              ["notes", "Notas", "Comentarios locales de la rutina"],
            ] as const
          ).map(([key, label, hint]) => (
            <label
              key={key}
              className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-surface-secondary/70 px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={duplicateOpts[key]}
                onChange={(event) =>
                  setDuplicateOpts((prev) => ({
                    ...prev,
                    [key]: event.target.checked,
                  }))
                }
                className="mt-1 size-4 accent-[var(--traza-primary)]"
              />
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-text-primary">
                  {label}
                </span>
                <span className="block text-[12px] text-text-muted">{hint}</span>
              </span>
            </label>
          ))}
        </div>
      </ConfirmationDialog>
    </div>
  );
}

function MetaChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] bg-surface-secondary/80 px-3 py-2.5 text-center">
      <p className="text-[12px] font-medium text-text-muted">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-text-primary">
        {value}
      </p>
    </div>
  );
}

function LivingRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className="text-[13px] font-semibold tabular-nums text-text-primary">
        {value}
      </span>
    </li>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: typeof Pencil;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] font-medium",
        danger ? "text-danger" : "text-text-primary",
        "hover:bg-surface-secondary/70",
      )}
    >
      <Icon size={18} strokeWidth={2} className="shrink-0 opacity-70" />
      {label}
    </button>
  );
}
