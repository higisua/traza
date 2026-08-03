"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "framer-motion";
import {
  Copy,
  GripVertical,
  Minus,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { useToast } from "@/components/feedback/Toast";
import {
  GhostButton,
  PrimaryButton,
  SecondaryButton,
} from "@/components/forms/Button";
import { FieldInput } from "@/components/forms/FieldInput";
import { BottomSheet } from "@/components/navigation/BottomSheet";
import { LOAD_INCREMENTS } from "@/features/exercises";
import {
  DEFAULT_ROUTINE_REST_SECONDS,
  DEFAULT_ROUTINE_TARGET_RIR,
  RoutineService,
  estimateDurationFromBlocks,
  normalizeBlockInput,
  useRoutines,
  type RoutineFieldErrors,
  type RoutineVersionSaveMode,
} from "@/features/routines";
import { createId } from "@/lib/storage/localStorage";
import {
  WorkoutCatalog,
  WorkoutHistoryService,
} from "@/features/workout";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type RoutineFormScreenProps = {
  mode: "create" | "edit";
  routineId?: string;
};

type BlockForm = {
  id: string;
  exerciseSlug: string;
  sets: string;
  repMin: string;
  repMax: string;
  rirMin: string;
  rirMax: string;
  restSeconds: string;
  durationMinutes: string;
  durationSeconds: string;
  comment: string;
  loadIncrementOverride: string;
};

type FormState = {
  name: string;
  description: string;
  goal: string;
  estimatedDurationMinutes: string;
  defaultRestSeconds: string;
  defaultTargetRir: string;
  blocks: BlockForm[];
};

const RIR_OPTIONS = [0, 1, 2, 3, 4] as const;
const REST_PRESETS = [60, 90, 120, 180] as const;

function blockToForm(block: {
  id: string;
  exerciseSlug: string;
  sets: number;
  repMin: number | null;
  repMax: number | null;
  rirMin: number | null;
  rirMax: number | null;
  restSeconds: number;
  durationMinutes: number | null;
  durationSeconds: number | null;
  comment: string | null;
  loadIncrementOverride: number | null;
}): BlockForm {
  return {
    id: block.id,
    exerciseSlug: block.exerciseSlug,
    sets: String(block.sets),
    repMin: block.repMin != null ? String(block.repMin) : "",
    repMax: block.repMax != null ? String(block.repMax) : "",
    rirMin: block.rirMin != null ? String(block.rirMin) : "",
    rirMax: block.rirMax != null ? String(block.rirMax) : "",
    restSeconds: String(block.restSeconds),
    durationMinutes:
      block.durationMinutes != null ? String(block.durationMinutes) : "",
    durationSeconds:
      block.durationSeconds != null ? String(block.durationSeconds) : "",
    comment: block.comment ?? "",
    loadIncrementOverride:
      block.loadIncrementOverride != null
        ? String(block.loadIncrementOverride)
        : "",
  };
}

function emptyForm(): FormState {
  return {
    name: "",
    description: "",
    goal: "",
    estimatedDurationMinutes: "45",
    defaultRestSeconds: String(DEFAULT_ROUTINE_REST_SECONDS),
    defaultTargetRir: String(DEFAULT_ROUTINE_TARGET_RIR),
    blocks: [],
  };
}

function configLineFor(block: BlockForm): string {
  return [
    `${block.sets || "–"} series`,
    block.repMin || block.repMax
      ? `${block.repMin || "–"}–${block.repMax || "–"} reps`
      : null,
    block.rirMin || block.rirMax
      ? `RIR ${block.rirMin || block.rirMax}${
          block.rirMax && block.rirMin && block.rirMin !== block.rirMax
            ? `–${block.rirMax}`
            : ""
        }`
      : null,
    block.restSeconds ? `${block.restSeconds}s` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function RoutineFormScreen({ mode, routineId }: RoutineFormScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { create, update, getWithCurrentVersion, assessUpdate } = useRoutines();
  const [hydrated, setHydrated] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<RoutineFieldErrors>({});
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [configDraft, setConfigDraft] = useState<BlockForm | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [versionConfirm, setVersionConfirm] = useState(false);
  const [pendingSave, setPendingSave] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [routineSlug, setRoutineSlug] = useState<string | null>(null);
  const [routineStatus, setRoutineStatus] = useState<"active" | "archived" | null>(
    null,
  );
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (mode === "create") {
      setForm(emptyForm());
      return;
    }
    if (!routineId) {
      setNotFound(true);
      return;
    }
    const pack = getWithCurrentVersion(routineId);
    if (!pack) {
      setNotFound(true);
      return;
    }
    setRoutineSlug(pack.routine.slug);
    setRoutineStatus(pack.routine.status);
    setForm({
      name: pack.routine.nameEs,
      description: pack.routine.description,
      goal: pack.routine.goal ?? "",
      estimatedDurationMinutes: String(pack.version.estimatedDurationMinutes),
      defaultRestSeconds: String(
        pack.routine.defaultRestSeconds ?? DEFAULT_ROUTINE_REST_SECONDS,
      ),
      defaultTargetRir: String(
        pack.routine.defaultTargetRir ?? DEFAULT_ROUTINE_TARGET_RIR,
      ),
      blocks: [...pack.version.blocks]
        .sort((a, b) => a.order - b.order)
        .map(blockToForm),
    });
  }, [hydrated, mode, routineId, getWithCurrentVersion]);

  useEffect(() => {
    if (!pickerOpen) return;
    const id = window.setTimeout(() => searchRef.current?.focus(), 40);
    return () => window.clearTimeout(id);
  }, [pickerOpen]);

  const activeExercises = useMemo(() => {
    if (!hydrated) return [];
    return WorkoutCatalog.listActiveExercises();
  }, [hydrated, pickerOpen]);

  const recentExercises = useMemo(() => {
    if (!hydrated || !pickerOpen) return [];
    const slugs = WorkoutHistoryService.getRecentExerciseSlugs(8);
    const bySlug = new Map(activeExercises.map((item) => [item.slug, item]));
    return slugs
      .map((slug) => bySlug.get(slug))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
  }, [hydrated, pickerOpen, activeExercises]);

  const filteredExercises = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return activeExercises;
    return activeExercises.filter((item) =>
      item.nameEs.toLowerCase().includes(q),
    );
  }, [activeExercises, pickerQuery]);

  const showRecientes = pickerQuery.trim().length === 0 && recentExercises.length > 0;

  const draftBlocks = useMemo(() => {
    return form.blocks.map((block, index) =>
      normalizeBlockInput(
        {
          id: block.id,
          exerciseSlug: block.exerciseSlug,
          sets: Number(block.sets) || 1,
          repMin: block.repMin ? Number(block.repMin) : null,
          repMax: block.repMax ? Number(block.repMax) : null,
          rirMin: block.rirMin ? Number(block.rirMin) : null,
          rirMax: block.rirMax ? Number(block.rirMax) : null,
          restSeconds: Number(block.restSeconds) || 0,
          durationMinutes: block.durationMinutes
            ? Number(block.durationMinutes)
            : null,
          durationSeconds: block.durationSeconds
            ? Number(block.durationSeconds)
            : null,
          comment: block.comment,
          loadIncrementOverride: block.loadIncrementOverride
            ? Number(block.loadIncrementOverride.replace(",", "."))
            : null,
        },
        index + 1,
      ),
    );
  }, [form.blocks]);

  const editingExercise = useMemo(() => {
    if (!configDraft) return null;
    return WorkoutCatalog.getExercise(configDraft.exerciseSlug);
  }, [configDraft]);

  function openBlockConfig(block: BlockForm) {
    setEditingBlockId(block.id);
    setConfigDraft({ ...block });
  }

  function closeBlockConfig() {
    setEditingBlockId(null);
    setConfigDraft(null);
  }

  function saveBlockConfig() {
    if (!configDraft || !editingBlockId) return;
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === editingBlockId ? { ...configDraft } : block,
      ),
    }));
    closeBlockConfig();
  }

  function removeBlock(id: string) {
    setForm((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== id),
    }));
    if (editingBlockId === id) closeBlockConfig();
  }

  function duplicateBlock(id: string) {
    setForm((prev) => {
      const index = prev.blocks.findIndex((block) => block.id === id);
      if (index < 0) return prev;
      const source = prev.blocks[index]!;
      const copy: BlockForm = { ...source, id: createId() };
      const next = [...prev.blocks];
      next.splice(index + 1, 0, copy);
      return { ...prev, blocks: next };
    });
  }

  function addExercise(slug: string) {
    const defaults = RoutineService.defaultsFromExercise(slug, {
      defaultRestSeconds: Number(form.defaultRestSeconds) || DEFAULT_ROUTINE_REST_SECONDS,
      defaultTargetRir: Number(form.defaultTargetRir) || DEFAULT_ROUTINE_TARGET_RIR,
    });
    if (!defaults) {
      showToast("Ejercicio no disponible", "danger");
      return;
    }
    const id = createId();
    const nextBlock = blockToForm({
      id,
      exerciseSlug: defaults.exerciseSlug,
      sets: defaults.sets,
      repMin: defaults.repMin,
      repMax: defaults.repMax,
      rirMin: defaults.rirMin,
      rirMax: defaults.rirMax,
      restSeconds: defaults.restSeconds,
      durationMinutes: defaults.durationMinutes ?? null,
      durationSeconds: defaults.durationSeconds ?? null,
      comment: null,
      loadIncrementOverride: defaults.loadIncrementOverride ?? null,
    });
    setForm((prev) => ({
      ...prev,
      blocks: [...prev.blocks, nextBlock],
      estimatedDurationMinutes: String(
        estimateDurationFromBlocks([
          ...draftBlocks,
          normalizeBlockInput(
            {
              ...defaults,
              id,
            },
            prev.blocks.length + 1,
          ),
        ]),
      ),
    }));
    setPickerOpen(false);
    setPickerQuery("");
  }

  function buildValidationRaw() {
    return {
      name: form.name,
      description: form.description,
      goal: form.goal,
      estimatedDurationMinutes: form.estimatedDurationMinutes,
      defaultRestSeconds: form.defaultRestSeconds,
      defaultTargetRir: form.defaultTargetRir,
      blocks: form.blocks.map((block) => ({
        id: block.id,
        exerciseSlug: block.exerciseSlug,
        sets: block.sets,
        repMin: block.repMin,
        repMax: block.repMax,
        rirMin: block.rirMin,
        rirMax: block.rirMax,
        restSeconds: block.restSeconds,
        durationMinutes: block.durationMinutes,
        durationSeconds: block.durationSeconds,
        comment: block.comment,
        loadIncrementOverride: block.loadIncrementOverride,
      })),
    };
  }

  function persist(versionMode?: RoutineVersionSaveMode) {
    const validated = RoutineService.validate(buildValidationRaw(), {
      excludeId: routineId,
    });
    if (!validated.ok) {
      setErrors(validated.errors);
      showToast("Revisa los campos del programa", "danger");
      return;
    }
    setErrors({});

    if (mode === "create") {
      const created = create(validated.value);
      showToast("Rutina creada", "success");
      router.push(`/more/training/routines/${created.id}`);
      return;
    }

    if (!routineId) return;

    const assessment = assessUpdate(routineId, validated.value);
    if (assessment.needsVersionChoice && !versionMode) {
      setVersionConfirm(true);
      return;
    }

    const updated = update(routineId, validated.value, {
      versionMode,
    });
    if (!updated) {
      showToast("No se pudo guardar", "danger");
      return;
    }

    if (versionMode === "new_version") {
      showToast(
        "Nueva versión guardada · el historial conserva la anterior",
        "success",
      );
    } else {
      showToast("Rutina actualizada", "success");
    }
    router.push(`/more/training/routines/${updated.id}`);
  }

  function startTraining() {
    if (mode !== "edit" || !routineSlug) return;
    if (routineStatus !== "active") {
      showToast("Restaura la rutina para entrenar con ella", "default");
      return;
    }
    router.push(`/train/${routineSlug}`);
  }

  if (!hydrated) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title={mode === "create" ? "Nueva rutina" : "Editar rutina"}
          onBack={() => router.push("/more/training/routines")}
        />
        <div className="mt-6 h-[160px] rounded-[20px] bg-surface/60" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title="Editar rutina"
          onBack={() => router.push("/more/training/routines")}
        />
        <p className="mt-8 text-center text-body text-text-secondary">
          No se encontró esta rutina.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh pb-[max(120px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title={mode === "create" ? "Nueva rutina" : "Editar rutina"}
          onBack={() =>
            router.push(
              mode === "edit" && routineId
                ? `/more/training/routines/${routineId}`
                : "/more/training/routines",
            )
          }
        />

        <p className="mt-1 text-caption text-text-secondary">
          Diseña el entrenamiento · overrides solo en esta rutina
        </p>

        <section className="mt-5 space-y-3">
          <FieldInput
            label="Nombre"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            error={errors.name}
            placeholder="Ej. Día A · fuerza"
          />
          <FieldInput
            label="Descripción"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            error={errors.description}
            placeholder="Qué trabaja este programa"
          />
          <FieldInput
            label="Objetivo"
            value={form.goal}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, goal: event.target.value }))
            }
            error={errors.goal}
            placeholder="Opcional · hipertrofia, mantenimiento…"
          />
          <FieldInput
            label="Duración estimada (min)"
            inputMode="numeric"
            value={form.estimatedDurationMinutes}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                estimatedDurationMinutes: event.target.value,
              }))
            }
            error={errors.estimatedDurationMinutes}
          />
        </section>

        <section className="mt-4 rounded-[12px] bg-surface-secondary/70 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-[11px] font-medium uppercase tracking-label text-text-muted">
              Valores por defecto
            </h2>
            <p className="truncate text-[11px] text-text-muted">
              Al añadir ejercicios
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-[11px] font-medium text-text-muted">
                Descanso
              </span>
              <div className="flex gap-1">
                {REST_PRESETS.map((seconds) => {
                  const active = form.defaultRestSeconds === String(seconds);
                  return (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          defaultRestSeconds: String(seconds),
                        }))
                      }
                      className={cn(
                        "h-7 min-w-[40px] rounded-[8px] px-1.5 text-[11px] font-semibold tabular-nums",
                        active
                          ? "bg-text-primary text-surface"
                          : "bg-surface text-text-secondary",
                      )}
                    >
                      {seconds}s
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="shrink-0 text-[11px] font-medium text-text-muted">
                RIR
              </span>
              <div className="flex gap-1">
                {RIR_OPTIONS.map((rir) => {
                  const active = form.defaultTargetRir === String(rir);
                  return (
                    <button
                      key={rir}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          defaultTargetRir: String(rir),
                        }))
                      }
                      className={cn(
                        "flex size-7 items-center justify-center rounded-[8px] text-[11px] font-semibold tabular-nums",
                        active
                          ? "bg-text-primary text-surface"
                          : "bg-surface text-text-secondary",
                      )}
                    >
                      {rir}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="mt-8 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-label font-medium uppercase tracking-label text-text-muted">
              Ejercicios
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              {form.blocks.length} ejercicio
              {form.blocks.length === 1 ? "" : "s"} · toca para configurar
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex h-[44px] items-center gap-1.5 rounded-[12px] bg-primary px-3.5 text-[13px] font-semibold text-text-primary shadow-train active:scale-95"
          >
            <Plus size={16} strokeWidth={2.25} />
            Añadir
          </button>
        </div>

        {errors.blocks ? (
          <p className="mt-2 text-[13px] font-medium text-danger">
            {errors.blocks}
          </p>
        ) : null}

        {form.blocks.length === 0 ? (
          <div className="mt-3 rounded-[20px] bg-surface px-5 py-8 text-center shadow-xs ring-1 ring-black/[0.03]">
            <p className="text-[15px] font-semibold text-text-primary">
              Empieza con un ejercicio
            </p>
            <p className="mt-1 text-caption text-text-secondary">
              Solo ejercicios activos de tu biblioteca.
            </p>
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={form.blocks}
            onReorder={(blocks) => setForm((prev) => ({ ...prev, blocks }))}
            className="mt-2.5 flex flex-col gap-1.5"
          >
            {form.blocks.map((block) => (
              <BlockRow
                key={block.id}
                block={block}
                onOpen={() => openBlockConfig(block)}
                onDuplicate={() => duplicateBlock(block.id)}
                onRemove={() => removeBlock(block.id)}
              />
            ))}
          </Reorder.Group>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/50 bg-background/95 px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg gap-2">
          {mode === "edit" && routineSlug && routineStatus === "active" ? (
            <SecondaryButton
              className="flex-1"
              onClick={startTraining}
              disabled={pendingSave}
            >
              Iniciar entrenamiento
            </SecondaryButton>
          ) : null}
          <PrimaryButton
            className="flex-[1.4]"
            loading={pendingSave}
            onClick={() => {
              setPendingSave(true);
              try {
                persist();
              } finally {
                setPendingSave(false);
              }
            }}
          >
            Guardar
          </PrimaryButton>
        </div>
      </div>

      <BottomSheet
        open={Boolean(configDraft)}
        onClose={closeBlockConfig}
        title={editingExercise?.nameEs ?? "Configurar ejercicio"}
        className="max-h-[min(88dvh,720px)] overflow-hidden"
      >
        {configDraft ? (
          <div className="max-h-[min(72dvh,620px)] space-y-5 overflow-y-auto pb-1">
            <p className="text-[13px] text-text-muted">
              Solo esta rutina · no modifica la biblioteca
            </p>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-text-secondary">
                Series
              </p>
              <Stepper
                value={Number(configDraft.sets) || 1}
                min={1}
                max={20}
                onChange={(value) =>
                  setConfigDraft((prev) =>
                    prev ? { ...prev, sets: String(value) } : prev,
                  )
                }
              />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-text-secondary">
                Repeticiones
              </p>
              <div className="grid grid-cols-2 gap-2">
                <TinyField
                  label="Mín"
                  value={configDraft.repMin}
                  onChange={(value) =>
                    setConfigDraft((prev) =>
                      prev ? { ...prev, repMin: value } : prev,
                    )
                  }
                />
                <TinyField
                  label="Máx"
                  value={configDraft.repMax}
                  onChange={(value) =>
                    setConfigDraft((prev) =>
                      prev ? { ...prev, repMax: value } : prev,
                    )
                  }
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-text-secondary">
                RIR objetivo
              </p>
              <div className="flex gap-2">
                {RIR_OPTIONS.map((rir) => {
                  const active = configDraft.rirMin === String(rir);
                  return (
                    <button
                      key={rir}
                      type="button"
                      onClick={() =>
                        setConfigDraft((prev) =>
                          prev
                            ? {
                                ...prev,
                                rirMin: String(rir),
                                rirMax: String(rir),
                              }
                            : prev,
                        )
                      }
                      className={cn(
                        "flex h-[44px] flex-1 items-center justify-center rounded-[12px] text-[15px] font-semibold tabular-nums",
                        active
                          ? "bg-text-primary text-surface"
                          : "bg-surface-secondary text-text-secondary",
                      )}
                    >
                      {rir}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-text-secondary">
                Descanso (s)
              </p>
              <div className="flex flex-wrap gap-2">
                {REST_PRESETS.map((seconds) => {
                  const active = configDraft.restSeconds === String(seconds);
                  return (
                    <button
                      key={seconds}
                      type="button"
                      onClick={() =>
                        setConfigDraft((prev) =>
                          prev
                            ? { ...prev, restSeconds: String(seconds) }
                            : prev,
                        )
                      }
                      className={cn(
                        "h-[44px] min-w-[56px] rounded-[12px] px-3 text-[13px] font-semibold tabular-nums",
                        active
                          ? "bg-text-primary text-surface"
                          : "bg-surface-secondary text-text-secondary",
                      )}
                    >
                      {seconds}s
                    </button>
                  );
                })}
                <input
                  inputMode="numeric"
                  value={configDraft.restSeconds}
                  onChange={(event) =>
                    setConfigDraft((prev) =>
                      prev
                        ? { ...prev, restSeconds: event.target.value }
                        : prev,
                    )
                  }
                  aria-label="Descanso personalizado"
                  className="h-[44px] w-[72px] rounded-[12px] border border-border/70 bg-background px-2 text-center text-[14px] font-medium tabular-nums text-text-primary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25"
                />
              </div>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                Incremento de carga
              </span>
              <select
                value={configDraft.loadIncrementOverride}
                onChange={(event) =>
                  setConfigDraft((prev) =>
                    prev
                      ? {
                          ...prev,
                          loadIncrementOverride: event.target.value,
                        }
                      : prev,
                  )
                }
                className="h-[44px] w-full rounded-[12px] border border-border/70 bg-background px-3 text-[14px] font-medium text-text-primary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25"
              >
                <option value="">Biblioteca</option>
                {LOAD_INCREMENTS.map((inc) => (
                  <option key={inc} value={String(inc)}>
                    {String(inc).replace(".", ",")} kg
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-text-secondary">
                Nota (opcional)
              </span>
              <input
                value={configDraft.comment}
                onChange={(event) =>
                  setConfigDraft((prev) =>
                    prev ? { ...prev, comment: event.target.value } : prev,
                  )
                }
                placeholder="Solo en esta rutina…"
                className="h-[44px] w-full rounded-[12px] border border-border/70 bg-background px-3 text-[14px] text-text-primary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25"
              />
            </label>

            <PrimaryButton onClick={saveBlockConfig}>Guardar</PrimaryButton>

            <button
              type="button"
              onClick={() => {
                if (!editingBlockId) return;
                removeBlock(editingBlockId);
              }}
              className="flex h-[44px] w-full items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium text-danger/90 hover:bg-danger/5"
            >
              <Trash2 size={16} />
              Quitar de esta rutina
            </button>
          </div>
        ) : null}
      </BottomSheet>

      {pickerOpen ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-background/80 backdrop-blur-sm">
          <div className="mt-auto max-h-[85dvh] overflow-hidden rounded-t-[24px] bg-surface shadow-m ring-1 ring-black/[0.06]">
            <div className="flex items-center justify-between px-5 pt-4">
              <div>
                <p className="text-[17px] font-semibold text-text-primary">
                  Añadir ejercicio
                </p>
                <p className="text-[13px] text-text-muted">
                  Busca y toca · se añade al instante
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => {
                  setPickerOpen(false);
                  setPickerQuery("");
                }}
                className="flex size-[44px] items-center justify-center rounded-[12px] text-text-primary hover:bg-surface-secondary/80"
              >
                <X size={20} />
              </button>
            </div>
            <label className="relative mx-5 mt-3 block">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
              />
              <input
                ref={searchRef}
                value={pickerQuery}
                onChange={(event) => setPickerQuery(event.target.value)}
                placeholder="Buscar ejercicio…"
                autoFocus
                className="h-[48px] w-full rounded-[16px] border border-border/80 bg-background pl-11 pr-4 text-body font-medium text-text-primary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25"
              />
            </label>
            <div className="mt-3 max-h-[55dvh] overflow-y-auto px-5 pb-8">
              {showRecientes ? (
                <div className="mb-4">
                  <p className="text-label font-medium uppercase tracking-label text-text-muted">
                    Recientes
                  </p>
                  <ul className="mt-2">
                    {recentExercises.map((exercise) => (
                      <ExercisePickRow
                        key={`recent-${exercise.slug}`}
                        name={exercise.nameEs}
                        image={exercise.image}
                        hint="Usado recientemente"
                        onSelect={() => addExercise(exercise.slug)}
                      />
                    ))}
                  </ul>
                </div>
              ) : null}

              <p className="text-label font-medium uppercase tracking-label text-text-muted">
                Biblioteca
              </p>
              <ul className="mt-2">
                {filteredExercises.length === 0 ? (
                  <li className="py-8 text-center text-[14px] text-text-muted">
                    Ningún ejercicio coincide
                  </li>
                ) : (
                  filteredExercises.map((exercise) => (
                    <ExercisePickRow
                      key={exercise.slug}
                      name={exercise.nameEs}
                      image={exercise.image}
                      hint={`${exercise.defaultSets} series por defecto`}
                      onSelect={() => addExercise(exercise.slug)}
                    />
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      ) : null}

      {versionConfirm ? (
        <div className="fixed inset-0 z-[var(--traza-z-dialog)] flex items-center justify-center px-5">
          <button
            type="button"
            aria-label="Cerrar diálogo"
            className="absolute inset-0 bg-text-primary/30"
            onClick={() => setVersionConfirm(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="version-save-title"
            className="relative z-10 w-full max-w-[length:var(--traza-forms-max)] rounded-l bg-surface p-6 shadow-l"
          >
            <h2
              id="version-save-title"
              className="text-card-title font-semibold leading-title tracking-title text-text-primary"
            >
              ¿Cómo guardar los cambios?
            </h2>
            <p className="mt-3 text-body text-text-secondary">
              Has cambiado la estructura y esta rutina ya tiene historial.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <PrimaryButton
                onClick={() => {
                  setVersionConfirm(false);
                  persist("inplace");
                }}
              >
                Actualizar esta rutina
              </PrimaryButton>
              <p className="px-1 text-[12px] text-text-muted">
                Sobrescribe la versión actual. El historial de sesiones no se
                reescribe.
              </p>
              <SecondaryButton
                className="mt-2"
                onClick={() => {
                  setVersionConfirm(false);
                  persist("new_version");
                }}
              >
                Crear nueva versión
              </SecondaryButton>
              <p className="px-1 text-[12px] text-text-muted">
                Conserva la anterior para el histórico y usa la nueva en
                Entrenar.
              </p>
              <GhostButton
                className="mt-3"
                onClick={() => setVersionConfirm(false)}
              >
                Cancelar
              </GhostButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function BlockRow({
  block,
  onOpen,
  onDuplicate,
  onRemove,
}: {
  block: BlockForm;
  onOpen: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const exercise = WorkoutCatalog.getExercise(block.exerciseSlug);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  return (
    <Reorder.Item
      value={block}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.02,
        boxShadow: "0 12px 28px rgba(20, 24, 18, 0.14)",
        zIndex: 20,
      }}
      transition={{
        duration: motionDuration.fast,
        ease: motionEase.standard,
      }}
      className={cn(
        "list-none rounded-[12px] bg-surface shadow-xs ring-1 ring-black/[0.03]",
        menuOpen ? "relative z-30 overflow-visible" : "overflow-hidden",
      )}
    >
      <div className="flex items-center gap-0 pl-0 pr-0.5">
        <button
          type="button"
          aria-label="Arrastrar para reordenar"
          onPointerDown={(event) => controls.start(event)}
          className="flex h-10 w-7 shrink-0 touch-none items-center justify-center text-text-muted/55 hover:text-text-secondary"
        >
          <GripVertical size={14} strokeWidth={2} />
        </button>

        <button
          type="button"
          className="flex min-h-[44px] min-w-0 flex-1 items-center gap-2 rounded-[10px] py-1.5 pr-1 text-left hover:bg-surface-secondary/40"
          onClick={onOpen}
        >
          <div className="relative size-8 shrink-0 overflow-hidden rounded-[8px] bg-surface-secondary/70">
            {exercise ? (
              <Image
                src={exercise.image}
                alt=""
                fill
                sizes="32px"
                className="object-contain p-0.5"
              />
            ) : null}
          </div>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold leading-tight text-text-primary">
              {exercise?.nameEs ?? block.exerciseSlug}
            </span>
            <span className="mt-px block truncate text-[11px] leading-tight text-text-muted">
              {configLineFor(block)}
              {block.comment ? ` · ${block.comment}` : ""}
            </span>
          </span>
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            aria-label="Más opciones"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex size-8 items-center justify-center rounded-[8px] text-text-muted/50 hover:bg-surface-secondary/70 hover:text-text-secondary"
          >
            <MoreHorizontal size={16} strokeWidth={2} />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-[calc(100%+4px)] z-40 min-w-[180px] overflow-hidden rounded-[14px] bg-surface py-1 shadow-m ring-1 ring-black/[0.06]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate();
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] font-medium text-text-primary hover:bg-surface-secondary/70"
              >
                <Copy size={16} strokeWidth={2} className="shrink-0 opacity-70" />
                Duplicar
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onRemove();
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] font-medium text-danger hover:bg-surface-secondary/70"
              >
                <Trash2
                  size={16}
                  strokeWidth={2}
                  className="shrink-0 opacity-70"
                />
                Quitar
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Reorder.Item>
  );
}

function ExercisePickRow({
  name,
  image,
  hint,
  onSelect,
}: {
  name: string;
  image: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 rounded-[14px] py-2.5 text-left hover:bg-surface-secondary/60"
      >
        <div className="relative size-[44px] shrink-0 overflow-hidden rounded-[12px] bg-surface-secondary/70">
          <Image
            src={image}
            alt=""
            fill
            sizes="44px"
            className="object-contain p-0.5"
          />
        </div>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-text-primary">
            {name}
          </span>
          <span className="block text-[12px] text-text-muted">{hint}</span>
        </span>
        <Plus size={18} className="shrink-0 text-text-muted opacity-55" />
      </button>
    </li>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="Menos series"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-[44px] items-center justify-center rounded-[12px] bg-surface-secondary text-text-primary disabled:opacity-30"
      >
        <Minus size={18} />
      </button>
      <span className="min-w-[48px] text-center text-[22px] font-semibold tabular-nums text-text-primary">
        {value}
      </span>
      <button
        type="button"
        aria-label="Más series"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex size-[44px] items-center justify-center rounded-[12px] bg-surface-secondary text-text-primary disabled:opacity-30"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}

function TinyField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-text-secondary">
        {label}
      </span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[44px] w-full rounded-[12px] border border-border/70 bg-background px-2.5 text-center text-[14px] font-medium tabular-nums text-text-primary focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25"
      />
    </label>
  );
}
