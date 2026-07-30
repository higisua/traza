"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { BottomSheet } from "@/components/navigation/BottomSheet";
import { FieldInput } from "@/components/forms/FieldInput";
import { NumberInput } from "@/components/forms/NumberInput";
import {
  DangerButton,
  GhostButton,
  PrimaryButton,
} from "@/components/forms/Button";
import {
  WeightService,
  formatBodyFatPct,
  formatDateTimeChip,
  formatWeightKg,
  nowDateInputValue,
  nowTimeInputValue,
  type WeightEntry,
  type WeightFieldErrors,
} from "@/features/weight";
import { cn } from "@/lib/utils/cn";

type WeightEntrySheetProps = {
  open: boolean;
  entry?: WeightEntry | null;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
  onRequestDelete?: (entry: WeightEntry) => void;
};

type FormState = {
  entryDate: string;
  entryTime: string;
  weightKg: string;
  bodyFatPct: string;
};

function toFormState(entry?: WeightEntry | null): FormState {
  if (!entry) {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      weightKg: "",
      bodyFatPct: "",
    };
  }

  return {
    entryDate: entry.entryDate,
    entryTime: entry.entryTime,
    weightKg: formatWeightKg(entry.weightKg),
    bodyFatPct:
      entry.bodyFatPct !== null ? formatBodyFatPct(entry.bodyFatPct) : "",
  };
}

function sanitizeDecimalInput(raw: string): string {
  const normalized = raw.replace(".", ",");
  const cleaned = normalized.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]},${parts.slice(1).join("")}`;
}

export function WeightEntrySheet({
  open,
  entry,
  onClose,
  onSaved,
  onRequestDelete,
}: WeightEntrySheetProps) {
  const isEdit = Boolean(entry);
  const [form, setForm] = useState<FormState>(() => toFormState(entry));
  const [errors, setErrors] = useState<WeightFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const weightRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(entry));
    setErrors({});
    setSaving(false);
    setWhenOpen(false);

    const timer = window.setTimeout(() => {
      weightRef.current?.focus();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [open, entry]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSave() {
    const result = WeightService.validate(form);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.entryDate || result.errors.entryTime) {
        setWhenOpen(true);
      }
      return;
    }

    setSaving(true);
    if (isEdit && entry) {
      WeightService.update(entry.id, result.value);
      onSaved("edit");
    } else {
      WeightService.create(result.value);
      onSaved("create");
    }
    setSaving(false);
    onClose();
  }

  function handleDelete() {
    if (!entry || !onRequestDelete) return;
    onClose();
    // Let the sheet start closing before the confirm dialog rises.
    window.setTimeout(() => onRequestDelete(entry), 160);
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar peso" : "Registrar peso"}
    >
      <div className="flex flex-col gap-4">
        <div>
          <button
            type="button"
            onClick={() => setWhenOpen((current) => !current)}
            className={cn(
              "flex w-full items-center justify-between rounded-[16px] bg-surface-secondary/70 px-4 py-3.5 text-left",
              "ring-1 ring-black/[0.03] transition-colors hover:bg-surface-secondary",
            )}
          >
            <div>
              <p className="text-[10px] font-semibold tracking-[0.08em] text-text-muted uppercase">
                Cuándo
              </p>
              <p className="mt-1 text-[15px] font-semibold tabular-nums text-text-primary">
                {formatDateTimeChip(form.entryDate, form.entryTime)}
              </p>
            </div>
            <ChevronDown
              size={18}
              strokeWidth={1.8}
              className={cn(
                "text-text-muted transition-transform duration-200",
                whenOpen && "rotate-180",
              )}
            />
          </button>

          {whenOpen ? (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <FieldInput
                label="Fecha"
                type="date"
                value={form.entryDate}
                error={errors.entryDate}
                onChange={(event) => updateField("entryDate", event.target.value)}
              />
              <FieldInput
                label="Hora"
                type="time"
                value={form.entryTime}
                error={errors.entryTime}
                onChange={(event) => updateField("entryTime", event.target.value)}
              />
            </div>
          ) : errors.entryDate || errors.entryTime ? (
            <p className="mt-2 text-caption text-danger">
              {errors.entryDate ?? errors.entryTime}
            </p>
          ) : null}
        </div>

        <NumberInput
          ref={weightRef}
          label="Peso"
          unit="kg"
          inputMode="decimal"
          enterKeyHint="next"
          placeholder="0,00"
          value={form.weightKg}
          error={errors.weightKg}
          onClear={() => updateField("weightKg", "")}
          onChange={(event) =>
            updateField("weightKg", sanitizeDecimalInput(event.target.value))
          }
        />

        <NumberInput
          label="Grasa corporal"
          unit="%"
          inputMode="decimal"
          enterKeyHint="done"
          placeholder="Opcional"
          value={form.bodyFatPct}
          error={errors.bodyFatPct}
          onClear={() => updateField("bodyFatPct", "")}
          onChange={(event) =>
            updateField("bodyFatPct", sanitizeDecimalInput(event.target.value))
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSave();
            }
          }}
        />

        <div className="mt-1 flex flex-col gap-2">
          <PrimaryButton loading={saving} onClick={handleSave}>
            Guardar
          </PrimaryButton>
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          {isEdit && onRequestDelete ? (
            <DangerButton onClick={handleDelete}>Eliminar registro</DangerButton>
          ) : null}
        </div>
      </div>
    </BottomSheet>
  );
}
