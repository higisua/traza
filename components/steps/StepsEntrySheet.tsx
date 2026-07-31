"use client";

import { useEffect, useRef, useState } from "react";
import { NumberInput } from "@/components/forms/NumberInput";
import {
  RecordBottomSheet,
  RecordWhenField,
} from "@/components/tracking";
import {
  StepsService,
  type StepsEntry,
  type StepsFieldErrors,
} from "@/features/steps";
import {
  nowDateInputValue,
  nowTimeInputValue,
} from "@/lib/tracking/dateTime";
import { sanitizeIntegerInput } from "@/lib/tracking/input";

type StepsEntrySheetProps = {
  open: boolean;
  entry?: StepsEntry | null;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
  onRequestDelete?: (entry: StepsEntry) => void;
};

type FormState = {
  entryDate: string;
  entryTime: string;
  steps: string;
};

function toFormState(entry?: StepsEntry | null): FormState {
  if (!entry) {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      steps: "",
    };
  }

  return {
    entryDate: entry.entryDate,
    entryTime: entry.entryTime,
    steps: String(entry.steps),
  };
}

export function StepsEntrySheet({
  open,
  entry,
  onClose,
  onSaved,
  onRequestDelete,
}: StepsEntrySheetProps) {
  const isEdit = Boolean(entry);
  const [form, setForm] = useState<FormState>(() => toFormState(entry));
  const [errors, setErrors] = useState<StepsFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const stepsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(entry));
    setErrors({});
    setSaving(false);
    setWhenOpen(false);
    const timer = window.setTimeout(() => stepsRef.current?.focus(), 220);
    return () => window.clearTimeout(timer);
  }, [open, entry]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSave() {
    const result = StepsService.validate(form);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.entryDate || result.errors.entryTime) {
        setWhenOpen(true);
      }
      return;
    }

    setSaving(true);
    if (isEdit && entry) {
      StepsService.update(entry.id, result.value);
      onSaved("edit");
    } else {
      StepsService.create(result.value);
      onSaved("create");
    }
    setSaving(false);
    onClose();
  }

  function handleDelete() {
    if (!entry || !onRequestDelete) return;
    onClose();
    window.setTimeout(() => onRequestDelete(entry), 160);
  }

  return (
    <RecordBottomSheet
      open={open}
      title={isEdit ? "Editar pasos" : "Registrar pasos"}
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      onRequestDelete={isEdit && onRequestDelete ? handleDelete : undefined}
      whenSlot={
        <RecordWhenField
          entryDate={form.entryDate}
          entryTime={form.entryTime}
          open={whenOpen}
          onToggle={() => setWhenOpen((current) => !current)}
          onDateChange={(value) => updateField("entryDate", value)}
          onTimeChange={(value) => updateField("entryTime", value)}
          dateError={errors.entryDate}
          timeError={errors.entryTime}
        />
      }
    >
      <NumberInput
        ref={stepsRef}
        label="Pasos"
        inputMode="numeric"
        enterKeyHint="done"
        placeholder="10000"
        value={form.steps}
        error={errors.steps}
        onClear={() => updateField("steps", "")}
        onChange={(event) =>
          updateField("steps", sanitizeIntegerInput(event.target.value))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            handleSave();
          }
        }}
      />
    </RecordBottomSheet>
  );
}
