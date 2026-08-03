"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import {
  useRoutines,
  type RoutineFilters,
  type RoutineStatus,
} from "@/features/routines";
import {
  WorkoutCatalog,
  formatApproxDuration,
  formatExerciseCount,
} from "@/features/workout";
import { listItemVariants, motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS: { value: RoutineStatus | "all"; label: string }[] = [
  { value: "active", label: "Activas" },
  { value: "archived", label: "Archivadas" },
  { value: "all", label: "Todas" },
];

type CreateMode = "empty" | "duplicate";

export function RoutineListScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RoutineStatus | "all">("active");
  const [createOpen, setCreateOpen] = useState(false);
  const [createMode, setCreateMode] = useState<CreateMode>("empty");
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  const filters = useMemo<RoutineFilters>(
    () => ({ query, status }),
    [query, status],
  );

  const { routines, active, all, duplicate } = useRoutines(filters);

  const duplicateCandidates = useMemo(
    () => all.filter((item) => item.status === "active"),
    [all],
  );

  const collectionHint = hydrated
    ? active.length === 1
      ? "1 rutina activa · disponible en Entrenar"
      : `${active.length} rutinas activas · disponibles en Entrenar`
    : null;

  function openCreate() {
    setCreateMode("empty");
    setDuplicateSourceId(duplicateCandidates[0]?.id ?? null);
    setCreateOpen(true);
  }

  function confirmCreate() {
    if (createMode === "empty") {
      setCreateOpen(false);
      router.push("/more/training/routines/new");
      return;
    }

    if (!duplicateSourceId) {
      showToast("Elige una rutina para duplicar", "danger");
      return;
    }

    const copy = duplicate(duplicateSourceId);
    setCreateOpen(false);
    if (!copy) {
      showToast("No se pudo duplicar", "danger");
      return;
    }
    showToast("Rutina duplicada", "success");
    router.push(`/more/training/routines/${copy.id}/edit`);
  }

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title="Rutinas"
          onBack={() => router.push("/more/training")}
          action={
            <button
              type="button"
              aria-label="Crear rutina"
              onClick={openCreate}
              className="flex size-[44px] items-center justify-center rounded-[12px] bg-primary text-text-primary shadow-train transition-transform duration-[var(--traza-duration-fast)] active:scale-95"
            >
              <Plus size={22} strokeWidth={2.25} />
            </button>
          }
        />

        <p className="mt-1 text-caption text-text-secondary">
          Programas vivos · el historial se conserva
        </p>
        {collectionHint ? (
          <p className="mt-0.5 text-[12px] font-medium text-text-muted">
            {collectionHint}
          </p>
        ) : null}

        <label className="relative mt-4 block">
          <span className="sr-only">Buscar rutinas</span>
          <Search
            size={18}
            strokeWidth={2}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre u objetivo…"
            className={cn(
              "h-[48px] w-full rounded-[16px] border border-border/80 bg-surface pl-11 pr-4",
              "text-body font-medium text-text-primary shadow-xs",
              "placeholder:text-text-muted",
              "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25",
            )}
          />
        </label>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatus(option.value)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors",
                status === option.value
                  ? "bg-text-primary text-surface"
                  : "bg-surface-secondary text-text-secondary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <ul className="mt-4 flex flex-col gap-2.5">
          {!hydrated ? (
            <li className="h-[88px] rounded-[20px] bg-surface/60" aria-hidden />
          ) : (
            <AnimatePresence mode="popLayout">
              {routines.length === 0 ? (
                <motion.li
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[20px] bg-surface px-5 py-10 text-center shadow-xs ring-1 ring-black/[0.03]"
                >
                  <p className="text-card-title font-semibold text-text-primary">
                    Nada en esta vista
                  </p>
                  <p className="mt-2 text-caption text-text-secondary">
                    Crea una rutina o duplica Día A / B / C como punto de partida.
                  </p>
                </motion.li>
              ) : (
                routines.map((routine, index) => {
                  const catalog = WorkoutCatalog.getRoutine(routine.slug);
                  const count = catalog?.exerciseCount ?? 0;
                  return (
                    <motion.li
                      key={routine.id}
                      layout
                      custom={index}
                      variants={listItemVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, y: -6 }}
                      transition={{
                        duration: motionDuration.fast,
                        ease: motionEase.standard,
                      }}
                    >
                      <Link
                        href={`/more/training/routines/${routine.id}`}
                        className="flex items-center gap-3 rounded-[20px] bg-surface p-3.5 shadow-xs ring-1 ring-black/[0.03] transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]"
                      >
                        <span className="flex size-[52px] shrink-0 flex-col items-center justify-center rounded-[16px] bg-primary/20 text-text-primary">
                          <span className="text-[17px] font-bold tabular-nums leading-none">
                            {count}
                          </span>
                          <span className="mt-0.5 text-[12px] font-medium text-text-muted">
                            ej.
                          </span>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[16px] font-semibold text-text-primary">
                              {routine.nameEs}
                            </span>
                            {routine.status === "archived" ? (
                              <span className="shrink-0 rounded-full bg-surface-secondary px-2 py-0.5 text-[12px] font-semibold text-text-muted">
                                Archivada
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-0.5 block truncate text-[13px] text-text-secondary">
                            {formatExerciseCount(count)} ·{" "}
                            {formatApproxDuration(
                              catalog?.estimatedDurationMinutes ?? 0,
                            )}
                          </span>
                          {routine.goal ? (
                            <span className="mt-0.5 block truncate text-[12px] text-text-muted">
                              {routine.goal}
                            </span>
                          ) : null}
                        </span>
                      </Link>
                    </motion.li>
                  );
                })
              )}
            </AnimatePresence>
          )}
        </ul>
      </div>

      <ConfirmationDialog
        open={createOpen}
        title="Nueva rutina"
        description="Empieza vacía o duplica una existente — el camino habitual para muchos."
        confirmLabel={createMode === "empty" ? "Crear vacía" : "Duplicar y editar"}
        cancelLabel="Cancelar"
        tone="neutral"
        onConfirm={confirmCreate}
        onCancel={() => setCreateOpen(false)}
      >
        <div className="mt-4 space-y-2">
          <CreateOption
            selected={createMode === "empty"}
            title="Vacía"
            hint="Nombre, defaults y ejercicios desde cero"
            onSelect={() => setCreateMode("empty")}
          />
          <CreateOption
            selected={createMode === "duplicate"}
            title="Duplicar una existente"
            hint="Copia estructura y configuración, luego afina"
            onSelect={() => {
              setCreateMode("duplicate");
              if (!duplicateSourceId && duplicateCandidates[0]) {
                setDuplicateSourceId(duplicateCandidates[0].id);
              }
            }}
          />
        </div>

        {createMode === "duplicate" ? (
          <div className="mt-3 max-h-[220px] space-y-1.5 overflow-y-auto">
            {duplicateCandidates.length === 0 ? (
              <p className="px-1 text-[13px] text-text-muted">
                No hay rutinas activas para duplicar.
              </p>
            ) : (
              duplicateCandidates.map((routine) => {
                const selected = duplicateSourceId === routine.id;
                return (
                  <button
                    key={routine.id}
                    type="button"
                    onClick={() => setDuplicateSourceId(routine.id)}
                    className={cn(
                      "flex w-full items-center rounded-[14px] px-3 py-2.5 text-left",
                      selected
                        ? "bg-primary/25 ring-1 ring-primary/40"
                        : "bg-surface-secondary/70",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-text-primary">
                      {routine.nameEs}
                    </span>
                    <span
                      className={cn(
                        "ml-2 size-[18px] shrink-0 rounded-full border-2",
                        selected
                          ? "border-text-primary bg-text-primary"
                          : "border-border-strong",
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>
        ) : null}
      </ConfirmationDialog>
    </div>
  );
}

function CreateOption({
  selected,
  title,
  hint,
  onSelect,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-[14px] px-3 py-3 text-left",
        selected
          ? "bg-primary/20 ring-1 ring-primary/35"
          : "bg-surface-secondary/70",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-text-primary" : "border-border-strong",
        )}
      >
        {selected ? (
          <span className="size-[8px] rounded-full bg-text-primary" />
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-text-primary">
          {title}
        </span>
        <span className="mt-0.5 block text-[12px] text-text-muted">{hint}</span>
      </span>
    </button>
  );
}
