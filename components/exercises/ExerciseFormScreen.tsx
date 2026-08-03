"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmationDialog } from "@/components/feedback/ConfirmationDialog";
import { useToast } from "@/components/feedback/Toast";
import { PrimaryButton, SecondaryButton } from "@/components/forms/Button";
import { FieldInput } from "@/components/forms/FieldInput";
import { ExerciseThumb } from "@/components/exercises/ExerciseThumb";
import {
  BODY_ZONES,
  BODY_ZONE_LABELS_ES,
  EQUIPMENT_LABELS_ES,
  EQUIPMENT_OPTIONS,
  ExerciseImageRepository,
  ExerciseService,
  LOAD_INCREMENTS,
  LOAD_TYPE_LABELS_ES,
  LOAD_TYPE_OPTIONS,
  MOVEMENT_PATTERNS,
  PATTERN_LABELS_ES,
  PRIMARY_MUSCLES,
  RECORDING_TYPE_LABELS_ES,
  SECONDARY_MUSCLES,
  inferBodyZone,
  muscleLabelEs,
  useExercises,
  type Exercise,
  type ExerciseFieldErrors,
  type ExerciseInput,
  type LoadType,
  type RecordingType,
} from "@/features/exercises";
import { cn } from "@/lib/utils/cn";

type ExerciseFormScreenProps = {
  mode: "create" | "edit";
  exerciseId?: string;
};

type FormState = {
  name: string;
  recordingType: RecordingType;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string;
  equipment: string;
  loadType: LoadType;
  bodyZone: string;
  sets: string;
  repMin: string;
  repMax: string;
  targetRir: string;
  restSeconds: string;
  loadIncrement: string;
  initialLoad: string;
  imagePath: string | null;
  techniqueTip: string;
  setupNote: string;
};

function fromExercise(exercise: Exercise): FormState {
  return {
    name: exercise.nameEs,
    recordingType: exercise.recordingType,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles,
    movementPattern: exercise.movementPattern ?? "",
    equipment: exercise.equipment ?? "",
    loadType: exercise.loadType,
    bodyZone: exercise.bodyZone ?? inferBodyZone(exercise.primaryMuscle),
    sets: String(exercise.defaults.sets),
    repMin:
      exercise.defaults.repMin != null ? String(exercise.defaults.repMin) : "",
    repMax:
      exercise.defaults.repMax != null ? String(exercise.defaults.repMax) : "",
    targetRir:
      exercise.defaults.targetRir != null
        ? String(exercise.defaults.targetRir)
        : "",
    restSeconds: String(exercise.defaults.restSeconds),
    loadIncrement: String(exercise.defaults.loadIncrement),
    initialLoad:
      exercise.defaults.initialLoad != null
        ? String(exercise.defaults.initialLoad)
        : "",
    imagePath: exercise.imagePath,
    techniqueTip: exercise.techniqueTip ?? "",
    setupNote: exercise.setupNote ?? "",
  };
}

function fromDefaults(type: RecordingType): FormState {
  const base = ExerciseService.defaultsForCreate(type);
  return {
    name: "",
    recordingType: type,
    primaryMuscle: base.primaryMuscle,
    secondaryMuscles: [],
    movementPattern: base.movementPattern ?? "",
    equipment: base.equipment ?? "",
    loadType: base.loadType ?? "Total Weight",
    bodyZone: base.bodyZone ?? "Upper body",
    sets: String(base.defaults.sets),
    repMin: base.defaults.repMin != null ? String(base.defaults.repMin) : "",
    repMax: base.defaults.repMax != null ? String(base.defaults.repMax) : "",
    targetRir:
      base.defaults.targetRir != null ? String(base.defaults.targetRir) : "",
    restSeconds: String(base.defaults.restSeconds),
    loadIncrement: String(base.defaults.loadIncrement),
    initialLoad:
      base.defaults.initialLoad != null
        ? String(base.defaults.initialLoad)
        : "",
    imagePath: null,
    techniqueTip: "",
    setupNote: "",
  };
}

export function ExerciseFormScreen({
  mode,
  exerciseId,
}: ExerciseFormScreenProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const { all, create, update, assessStructuralChange } = useExercises();

  const existing = useMemo(
    () =>
      mode === "edit" && exerciseId
        ? (all.find((item) => item.id === exerciseId) ?? null)
        : null,
    [all, exerciseId, mode],
  );

  const [form, setForm] = useState<FormState>(() => fromDefaults("strength"));
  const [errors, setErrors] = useState<ExerciseFieldErrors>({});
  const [structuralOpen, setStructuralOpen] = useState(false);
  const [structuralMessage, setStructuralMessage] = useState("");
  const [hydratedEditId, setHydratedEditId] = useState<string | null>(null);
  const [ready, setReady] = useState(mode === "create");

  useEffect(() => {
    if (mode === "create") {
      setReady(true);
      return;
    }
    // Wait for client seed/hydrate before deciding not-found.
    if (all.length === 0) return;
    if (existing) {
      if (hydratedEditId !== existing.id) {
        setForm(fromExercise(existing));
        setHydratedEditId(existing.id);
      }
      setReady(true);
      return;
    }
    setReady(true);
  }, [mode, existing, all.length, hydratedEditId]);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "primaryMuscle" && typeof value === "string") {
        next.bodyZone = inferBodyZone(value);
      }
      if (key === "recordingType") {
        const defaults = fromDefaults(value as RecordingType);
        next.sets = defaults.sets;
        next.repMin = defaults.repMin;
        next.repMax = defaults.repMax;
        next.targetRir = defaults.targetRir;
        next.restSeconds = defaults.restSeconds;
        next.loadIncrement = defaults.loadIncrement;
        next.initialLoad = defaults.initialLoad;
        next.loadType = defaults.loadType;
        next.equipment = defaults.equipment;
        next.movementPattern = defaults.movementPattern;
      }
      return next;
    });
  }

  function toggleSecondary(muscle: string) {
    setForm((current) => {
      const has = current.secondaryMuscles.includes(muscle);
      return {
        ...current,
        secondaryMuscles: has
          ? current.secondaryMuscles.filter((item) => item !== muscle)
          : [...current.secondaryMuscles, muscle],
      };
    });
  }

  function save() {
    const result = ExerciseService.validate(
      {
        name: form.name,
        recordingType: form.recordingType,
        primaryMuscle: form.primaryMuscle,
        sets: form.sets,
        repMin: form.repMin,
        repMax: form.repMax,
        targetRir: form.targetRir,
        restSeconds: form.restSeconds,
        loadIncrement: form.loadIncrement,
        initialLoad: form.initialLoad,
        secondaryMuscles: form.secondaryMuscles,
        movementPattern: form.movementPattern || null,
        equipment: form.equipment || null,
        loadType: form.loadType,
        bodyZone: form.bodyZone || null,
        imagePath: form.imagePath,
        techniqueTip: form.techniqueTip || null,
        setupNote: form.setupNote || null,
        nameEs: form.name,
      },
      { excludeId: existing?.id },
    );

    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setErrors({});

    if (mode === "edit" && existing) {
      const warning = assessStructuralChange(
        existing.id,
        result.value.recordingType,
      );
      if (warning) {
        setStructuralMessage(warning.message);
        setStructuralOpen(true);
        return;
      }
      applySave(result.value);
      return;
    }

    applySave(result.value);
  }

  function applySave(input: ExerciseInput) {
    if (mode === "edit" && existing) {
      update(existing.id, input);
      showToast("Ejercicio actualizado", "success");
      router.push(`/more/training/exercises/${existing.id}`);
    } else {
      const created = create(input);
      showToast("Ejercicio creado", "success");
      router.push(`/more/training/exercises/${created.id}`);
    }
    setStructuralOpen(false);
  }

  function confirmStructural() {
    const result = ExerciseService.validate(
      {
        name: form.name,
        recordingType: form.recordingType,
        primaryMuscle: form.primaryMuscle,
        sets: form.sets,
        repMin: form.repMin,
        repMax: form.repMax,
        targetRir: form.targetRir,
        restSeconds: form.restSeconds,
        loadIncrement: form.loadIncrement,
        initialLoad: form.initialLoad,
        secondaryMuscles: form.secondaryMuscles,
        movementPattern: form.movementPattern || null,
        equipment: form.equipment || null,
        loadType: form.loadType,
        bodyZone: form.bodyZone || null,
        imagePath: form.imagePath,
        techniqueTip: form.techniqueTip || null,
        setupNote: form.setupNote || null,
        nameEs: form.name,
      },
      { excludeId: existing?.id },
    );
    if (!result.ok) {
      setErrors(result.errors);
      setStructuralOpen(false);
      return;
    }
    applySave(result.value);
  }

  const needsReps =
    form.recordingType === "strength" || form.recordingType === "bodyweight";
  const catalogImages = ExerciseImageRepository.listCatalogPaths();

  if (mode === "edit" && !ready) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title="Editar ejercicio"
          onBack={() => router.push("/more/training/exercises")}
        />
        <div className="mt-4 h-40 rounded-[20px] bg-surface/60" />
      </div>
    );
  }

  if (mode === "edit" && ready && !existing) {
    return (
      <div className="px-5 pt-2">
        <PageHeader
          title="Editar"
          onBack={() => router.push("/more/training/exercises")}
        />
        <p className="mt-8 text-center text-body text-text-secondary">
          No se encontró este ejercicio.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh pb-[max(32px,env(safe-area-inset-bottom))]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,var(--traza-primary-soft)_0%,transparent_100%)] opacity-85"
      />

      <div className="relative px-5 pt-2">
        <PageHeader
          title={mode === "create" ? "Nuevo ejercicio" : "Editar ejercicio"}
          onBack={() =>
            router.push(
              existing
                ? `/more/training/exercises/${existing.id}`
                : "/more/training/exercises",
            )
          }
        />

        <FormSection title="Básico">
          <FieldInput
            label="Nombre"
            value={form.name}
            onChange={(event) => patch("name", event.target.value)}
            error={errors.name}
            placeholder="Ej. Press banca"
            autoComplete="off"
          />
          {existing ? (
            <p className="text-caption text-text-muted">
              Identificador estable:{" "}
              <span className="font-semibold text-text-secondary">
                {existing.slug}
              </span>
            </p>
          ) : null}
        </FormSection>

        <FormSection title="Clasificación">
          <SelectField
            label="Músculo principal"
            value={form.primaryMuscle}
            error={errors.primaryMuscle}
            onChange={(value) => patch("primaryMuscle", value)}
            options={PRIMARY_MUSCLES.map((muscle) => ({
              value: muscle,
              label: muscleLabelEs(muscle),
            }))}
          />

          <div>
            <p className="text-label font-medium uppercase tracking-label text-text-muted">
              Músculos secundarios
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SECONDARY_MUSCLES.map((muscle) => {
                const active = form.secondaryMuscles.includes(muscle);
                return (
                  <button
                    key={muscle}
                    type="button"
                    onClick={() => toggleSecondary(muscle)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                      active
                        ? "bg-text-primary text-surface"
                        : "bg-surface-secondary text-text-secondary",
                    )}
                  >
                    {muscleLabelEs(muscle)}
                  </button>
                );
              })}
            </div>
          </div>

          <SelectField
            label="Patrón de movimiento"
            value={form.movementPattern}
            onChange={(value) => patch("movementPattern", value)}
            options={[
              { value: "", label: "Sin especificar" },
              ...MOVEMENT_PATTERNS.map((pattern) => ({
                value: pattern,
                label: PATTERN_LABELS_ES[pattern] ?? pattern,
              })),
            ]}
          />
          <SelectField
            label="Material"
            value={form.equipment}
            onChange={(value) => patch("equipment", value)}
            options={[
              { value: "", label: "Sin especificar" },
              ...EQUIPMENT_OPTIONS.map((item) => ({
                value: item,
                label: EQUIPMENT_LABELS_ES[item] ?? item,
              })),
            ]}
          />
          <SelectField
            label="Zona corporal"
            value={form.bodyZone}
            onChange={(value) => patch("bodyZone", value)}
            options={BODY_ZONES.map((zone) => ({
              value: zone,
              label: BODY_ZONE_LABELS_ES[zone] ?? zone,
            }))}
          />
        </FormSection>

        <FormSection title="Tipo de registro">
          <div className="grid grid-cols-2 gap-2">
            {(
              ["strength", "bodyweight", "timed", "cardio"] as RecordingType[]
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => patch("recordingType", type)}
                className={cn(
                  "rounded-[16px] px-3 py-3 text-left text-[13px] font-semibold ring-1 transition-colors",
                  form.recordingType === type
                    ? "bg-primary/30 text-text-primary ring-primary/50"
                    : "bg-surface text-text-secondary ring-black/[0.04]",
                )}
              >
                {RECORDING_TYPE_LABELS_ES[type]}
              </button>
            ))}
          </div>
          {errors.recordingType ? (
            <p className="text-caption text-danger">{errors.recordingType}</p>
          ) : null}
          <SelectField
            label="Tipo de carga"
            value={form.loadType}
            onChange={(value) => patch("loadType", value as LoadType)}
            options={LOAD_TYPE_OPTIONS.map((item) => ({
              value: item,
              label: LOAD_TYPE_LABELS_ES[item] ?? item,
            }))}
          />
        </FormSection>

        <FormSection title="Valores por defecto">
          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Series"
              inputMode="numeric"
              value={form.sets}
              onChange={(event) => patch("sets", event.target.value)}
              error={errors.sets}
            />
            <FieldInput
              label="Descanso (s)"
              inputMode="numeric"
              value={form.restSeconds}
              onChange={(event) => patch("restSeconds", event.target.value)}
              error={errors.restSeconds}
            />
          </div>
          {needsReps ? (
            <div className="grid grid-cols-3 gap-3">
              <FieldInput
                label="Reps mín"
                inputMode="numeric"
                value={form.repMin}
                onChange={(event) => patch("repMin", event.target.value)}
                error={errors.repMin}
              />
              <FieldInput
                label="Reps máx"
                inputMode="numeric"
                value={form.repMax}
                onChange={(event) => patch("repMax", event.target.value)}
                error={errors.repMax}
              />
              <FieldInput
                label="RIR"
                inputMode="decimal"
                value={form.targetRir}
                onChange={(event) => patch("targetRir", event.target.value)}
                error={errors.targetRir}
              />
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="Incremento (kg)"
              value={form.loadIncrement}
              error={errors.loadIncrement}
              onChange={(value) => patch("loadIncrement", value)}
              options={LOAD_INCREMENTS.map((step) => ({
                value: String(step),
                label: String(step),
              }))}
            />
            {form.recordingType === "strength" ? (
              <FieldInput
                label="Carga inicial"
                inputMode="decimal"
                value={form.initialLoad}
                onChange={(event) => patch("initialLoad", event.target.value)}
                error={errors.initialLoad}
                hint="Opcional"
              />
            ) : (
              <div />
            )}
          </div>
        </FormSection>

        <FormSection title="Imagen">
          <ExerciseThumb
            imagePath={form.imagePath}
            alt={form.name || "Vista previa"}
            size="lg"
          />
          <div className="flex gap-2">
            <SecondaryButton
              fullWidth
              onClick={() => patch("imagePath", null)}
            >
              Sin imagen
            </SecondaryButton>
          </div>
          <p className="text-caption text-text-muted">
            Elige una imagen del catálogo. No se guardan archivos binarios en el
            dispositivo.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {catalogImages.map((path) => {
              const selected = form.imagePath === path;
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => patch("imagePath", path)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-[12px] ring-2",
                    selected ? "ring-primary" : "ring-transparent",
                  )}
                  aria-label={`Usar ${path}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={path}
                    alt=""
                    className="size-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        </FormSection>

        <FormSection title="Notas">
          <FieldInput
            label="Consejo técnico"
            value={form.techniqueTip}
            onChange={(event) => patch("techniqueTip", event.target.value)}
            placeholder="Opcional"
          />
          <FieldInput
            label="Configuración"
            value={form.setupNote}
            onChange={(event) => patch("setupNote", event.target.value)}
            placeholder="Opcional"
          />
        </FormSection>

        <div className="mt-6">
          <PrimaryButton onClick={save}>
            {mode === "create" ? "Añadir a la biblioteca" : "Guardar cambios"}
          </PrimaryButton>
        </div>
      </div>

      <ConfirmationDialog
        open={structuralOpen}
        title="Cambio estructural"
        description={structuralMessage}
        confirmLabel="Aplicar igual"
        cancelLabel="Cancelar"
        tone="neutral"
        onConfirm={confirmStructural}
        onCancel={() => setStructuralOpen(false)}
      />
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <h2 className="text-label font-medium uppercase tracking-label text-text-muted">
        {title}
      </h2>
      <div className="mt-3 flex flex-col gap-3 rounded-[20px] bg-surface p-4 shadow-xs ring-1 ring-black/[0.03]">
        {children}
      </div>
    </section>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div className="flex w-full flex-col gap-2">
      <label className="text-label font-medium uppercase tracking-label text-text-muted">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-[length:var(--traza-input-height)] w-full rounded-[var(--traza-radius-input)]",
          "border border-border/80 bg-surface px-4 shadow-xs",
          "text-body font-semibold text-text-primary",
          "focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25",
          error && "border-danger",
        )}
      >
        {options.map((option) => (
          <option key={option.value || "__empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-caption text-danger">{error}</p> : null}
    </div>
  );
}
