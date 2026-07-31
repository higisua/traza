"use client";

import { useEffect, useRef, useState } from "react";
import { NumberInput } from "@/components/forms/NumberInput";
import {
  RecordBottomSheet,
  RecordWhenField,
} from "@/components/tracking";
import {
  MeasurementService,
  formatCm,
  type MeasurementEntry,
  type MeasurementFieldErrors,
} from "@/features/measurements";
import {
  nowDateInputValue,
  nowTimeInputValue,
} from "@/lib/tracking/dateTime";
import { sanitizeDecimalInput } from "@/lib/tracking/input";

type MeasurementsEntrySheetProps = {
  open: boolean;
  entry?: MeasurementEntry | null;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
  onRequestDelete?: (entry: MeasurementEntry) => void;
};

type FormState = {
  entryDate: string;
  entryTime: string;
  waistCm: string;
  armCm: string;
  legCm: string;
};

function toFormState(entry?: MeasurementEntry | null): FormState {
  if (!entry) {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      waistCm: "",
      armCm: "",
      legCm: "",
    };
  }

  return {
    entryDate: entry.entryDate,
    entryTime: entry.entryTime,
    waistCm: formatCm(entry.waistCm),
    armCm: formatCm(entry.armCm),
    legCm: formatCm(entry.legCm),
  };
}

export function MeasurementsEntrySheet({
  open,
  entry,
  onClose,
  onSaved,
  onRequestDelete,
}: MeasurementsEntrySheetProps) {
  const isEdit = Boolean(entry);
  const [form, setForm] = useState<FormState>(() => toFormState(entry));
  const [errors, setErrors] = useState<MeasurementFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const waistRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(entry));
    setErrors({});
    setSaving(false);
    setWhenOpen(false);
    const timer = window.setTimeout(() => waistRef.current?.focus(), 220);
    return () => window.clearTimeout(timer);
  }, [open, entry]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSave() {
    const result = MeasurementService.validate(form);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.entryDate || result.errors.entryTime) {
        setWhenOpen(true);
      }
      return;
    }

    setSaving(true);
    if (isEdit && entry) {
      MeasurementService.update(entry.id, result.value);
      onSaved("edit");
    } else {
      MeasurementService.create(result.value);
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
      title={isEdit ? "Editar medición" : "Registrar medición"}
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
        ref={waistRef}
        label="Cintura"
        unit="cm"
        inputMode="decimal"
        enterKeyHint="next"
        placeholder="86"
        value={form.waistCm}
        error={errors.waistCm}
        onClear={() => updateField("waistCm", "")}
        onChange={(event) =>
          updateField("waistCm", sanitizeDecimalInput(event.target.value))
        }
      />
      <NumberInput
        label="Brazo"
        unit="cm"
        inputMode="decimal"
        enterKeyHint="next"
        placeholder="38"
        value={form.armCm}
        error={errors.armCm}
        onClear={() => updateField("armCm", "")}
        onChange={(event) =>
          updateField("armCm", sanitizeDecimalInput(event.target.value))
        }
      />
      <NumberInput
        label="Pierna"
        unit="cm"
        inputMode="decimal"
        enterKeyHint="done"
        placeholder="61"
        value={form.legCm}
        error={errors.legCm}
        onClear={() => updateField("legCm", "")}
        onChange={(event) =>
          updateField("legCm", sanitizeDecimalInput(event.target.value))
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
