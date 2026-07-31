"use client";

import { useEffect, useRef, useState } from "react";
import { NumberInput } from "@/components/forms/NumberInput";
import {
  RecordBottomSheet,
  RecordWhenField,
} from "@/components/tracking";
import {
  BloodPressureService,
  type BloodPressureEntry,
  type BloodPressureFieldErrors,
} from "@/features/blood-pressure";
import {
  nowDateInputValue,
  nowTimeInputValue,
} from "@/lib/tracking/dateTime";
import { sanitizeIntegerInput } from "@/lib/tracking/input";

type BloodPressureEntrySheetProps = {
  open: boolean;
  entry?: BloodPressureEntry | null;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
  onRequestDelete?: (entry: BloodPressureEntry) => void;
};

type FormState = {
  entryDate: string;
  entryTime: string;
  systolic: string;
  diastolic: string;
  pulse: string;
};

function toFormState(entry?: BloodPressureEntry | null): FormState {
  if (!entry) {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      systolic: "",
      diastolic: "",
      pulse: "",
    };
  }

  return {
    entryDate: entry.entryDate,
    entryTime: entry.entryTime,
    systolic: String(entry.systolic),
    diastolic: String(entry.diastolic),
    pulse: String(entry.pulse),
  };
}

export function BloodPressureEntrySheet({
  open,
  entry,
  onClose,
  onSaved,
  onRequestDelete,
}: BloodPressureEntrySheetProps) {
  const isEdit = Boolean(entry);
  const [form, setForm] = useState<FormState>(() => toFormState(entry));
  const [errors, setErrors] = useState<BloodPressureFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const systolicRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(entry));
    setErrors({});
    setSaving(false);
    setWhenOpen(false);
    const timer = window.setTimeout(() => systolicRef.current?.focus(), 220);
    return () => window.clearTimeout(timer);
  }, [open, entry]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSave() {
    const result = BloodPressureService.validate(form);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.entryDate || result.errors.entryTime) {
        setWhenOpen(true);
      }
      return;
    }

    setSaving(true);
    if (isEdit && entry) {
      BloodPressureService.update(entry.id, result.value);
      onSaved("edit");
    } else {
      BloodPressureService.create(result.value);
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
      title={isEdit ? "Editar tensión" : "Registrar tensión"}
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
      <div className="grid grid-cols-2 gap-3">
        <NumberInput
          ref={systolicRef}
          label="Sistólica"
          unit="mmHg"
          inputMode="numeric"
          enterKeyHint="next"
          placeholder="120"
          value={form.systolic}
          error={errors.systolic}
          onClear={() => updateField("systolic", "")}
          onChange={(event) =>
            updateField("systolic", sanitizeIntegerInput(event.target.value))
          }
        />
        <NumberInput
          label="Diastólica"
          unit="mmHg"
          inputMode="numeric"
          enterKeyHint="next"
          placeholder="80"
          value={form.diastolic}
          error={errors.diastolic}
          onClear={() => updateField("diastolic", "")}
          onChange={(event) =>
            updateField("diastolic", sanitizeIntegerInput(event.target.value))
          }
        />
      </div>

      <NumberInput
        label="Pulso"
        unit="ppm"
        inputMode="numeric"
        enterKeyHint="done"
        placeholder="60"
        value={form.pulse}
        error={errors.pulse}
        onClear={() => updateField("pulse", "")}
        onChange={(event) =>
          updateField("pulse", sanitizeIntegerInput(event.target.value))
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
