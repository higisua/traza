"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { ExerciseThumb } from "@/components/exercises/ExerciseThumb";
import {
  muscleLabelEs,
  RECORDING_TYPE_LABELS_ES,
  PRIMARY_MUSCLES,
  useExercises,
  type ExerciseFilters,
  type ExerciseStatus,
  type RecordingType,
} from "@/features/exercises";
import { listItemVariants, motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

const STATUS_OPTIONS: { value: ExerciseStatus | "all"; label: string }[] = [
  { value: "active", label: "Activos" },
  { value: "archived", label: "Archivados" },
  { value: "all", label: "Todos" },
];

const TYPE_OPTIONS: { value: RecordingType | "all"; label: string }[] = [
  { value: "all", label: "Tipo" },
  { value: "strength", label: "Fuerza" },
  { value: "bodyweight", label: "Peso corporal" },
  { value: "timed", label: "Tiempo" },
  { value: "cardio", label: "Cardio" },
];

export function ExerciseListScreen() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ExerciseStatus | "all">("active");
  const [recordingType, setRecordingType] = useState<RecordingType | "all">(
    "all",
  );
  const [primaryMuscle, setPrimaryMuscle] = useState<string | "all">("all");

  useEffect(() => {
    setHydrated(true);
  }, []);

  const filters = useMemo<ExerciseFilters>(
    () => ({
      query,
      status,
      recordingType,
      primaryMuscle,
    }),
    [query, status, recordingType, primaryMuscle],
  );

  const { exercises, active } = useExercises(filters);

  const collectionHint = hydrated
    ? active.length === 1
      ? "1 ejercicio activo en tu biblioteca"
      : `${active.length} ejercicios activos en tu biblioteca`
    : null;

  return (
    <div className="relative min-h-dvh pb-[max(24px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title="Biblioteca de ejercicios"
          onBack={() => router.push("/more/training")}
          action={
            <Link
              href="/more/training/exercises/new"
              aria-label="Añadir ejercicio"
              className="flex size-[44px] items-center justify-center rounded-[12px] bg-primary text-text-primary shadow-train transition-transform duration-[var(--traza-duration-fast)] active:scale-95"
            >
              <Plus size={22} strokeWidth={2.25} />
            </Link>
          }
        />

        <p className="mt-1 text-caption text-text-secondary">
          Catálogo personal · ejercicios disponibles
        </p>
        {collectionHint ? (
          <p className="mt-0.5 text-[12px] font-medium text-text-muted">
            {collectionHint}
          </p>
        ) : null}

        <label className="relative mt-4 block">
          <span className="sr-only">Buscar ejercicios</span>
          <Search
            size={18}
            strokeWidth={2}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre…"
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

        <div className="mt-2 flex gap-2">
          <select
            value={recordingType}
            onChange={(event) =>
              setRecordingType(event.target.value as RecordingType | "all")
            }
            className="h-[40px] min-w-0 flex-1 rounded-[12px] border border-border/70 bg-surface px-3 text-[13px] font-medium text-text-primary"
            aria-label="Filtrar por tipo"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={primaryMuscle}
            onChange={(event) => setPrimaryMuscle(event.target.value)}
            className="h-[40px] min-w-0 flex-1 rounded-[12px] border border-border/70 bg-surface px-3 text-[13px] font-medium text-text-primary"
            aria-label="Filtrar por músculo"
          >
            <option value="all">Músculo</option>
            {PRIMARY_MUSCLES.map((muscle) => (
              <option key={muscle} value={muscle}>
                {muscleLabelEs(muscle)}
              </option>
            ))}
          </select>
        </div>

        <ul className="mt-4 flex flex-col gap-2.5">
          {!hydrated ? (
            <li className="h-[72px] rounded-[20px] bg-surface/60" aria-hidden />
          ) : (
            <AnimatePresence mode="popLayout">
              {exercises.length === 0 ? (
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
                    Prueba otro filtro o añade un ejercicio a tu biblioteca.
                  </p>
                </motion.li>
              ) : (
                exercises.map((exercise, index) => (
                  <motion.li
                    key={exercise.id}
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
                      href={`/more/training/exercises/${exercise.id}`}
                      className="flex items-center gap-3 rounded-[20px] bg-surface p-3 shadow-xs ring-1 ring-black/[0.03] transition-transform duration-[var(--traza-duration-fast)] active:scale-[0.99]"
                    >
                      <ExerciseThumb
                        imagePath={exercise.imagePath}
                        alt={exercise.nameEs}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="truncate text-[16px] font-semibold leading-tight text-text-primary">
                            {exercise.nameEs}
                          </h2>
                          {exercise.status === "archived" ? (
                            <span className="shrink-0 rounded-full bg-surface-secondary px-2 py-0.5 text-[12px] font-semibold text-text-muted">
                              Archivado
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-[13px] text-text-secondary">
                          {RECORDING_TYPE_LABELS_ES[exercise.recordingType]} ·{" "}
                          {muscleLabelEs(exercise.primaryMuscle)}
                        </p>
                      </div>
                    </Link>
                  </motion.li>
                ))
              )}
            </AnimatePresence>
          )}
        </ul>
      </div>
    </div>
  );
}
