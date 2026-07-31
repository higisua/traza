"use client";

import { useEffect, useRef, useState } from "react";
import { FieldInput } from "@/components/forms/FieldInput";
import { NumberInput } from "@/components/forms/NumberInput";
import {
  RecordBottomSheet,
  RecordWhenField,
} from "@/components/tracking";
import {
  SleepService,
  durationFromBedWake,
  type SleepEntry,
  type SleepFieldErrors,
} from "@/features/sleep";
import {
  nowDateInputValue,
  nowTimeInputValue,
} from "@/lib/tracking/dateTime";
import { sanitizeIntegerInput } from "@/lib/tracking/input";

type SleepEntrySheetProps = {
  open: boolean;
  entry?: SleepEntry | null;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
  onRequestDelete?: (entry: SleepEntry) => void;
};

type FormState = {
  entryDate: string;
  entryTime: string;
  durationHours: string;
  durationMinutes: string;
  score: string;
  bedTime: string;
  wakeTime: string;
};

function toFormState(entry?: SleepEntry | null): FormState {
  if (!entry) {
    return {
      entryDate: nowDateInputValue(),
      entryTime: nowTimeInputValue(),
      durationHours: "",
      durationMinutes: "",
      score: "",
      bedTime: "",
      wakeTime: "",
    };
  }

  return {
    entryDate: entry.entryDate,
    entryTime: entry.entryTime,
    durationHours: String(Math.floor(entry.durationMinutes / 60)),
    durationMinutes: String(entry.durationMinutes % 60),
    score: entry.score !== null ? String(entry.score) : "",
    bedTime: entry.bedTime ?? "",
    wakeTime: entry.wakeTime ?? "",
  };
}

export function SleepEntrySheet({
  open,
  entry,
  onClose,
  onSaved,
  onRequestDelete,
}: SleepEntrySheetProps) {
  const isEdit = Boolean(entry);
  const [form, setForm] = useState<FormState>(() => toFormState(entry));
  const [errors, setErrors] = useState<SleepFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [whenOpen, setWhenOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const hoursRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(toFormState(entry));
    setErrors({});
    setSaving(false);
    setWhenOpen(false);
    setScheduleOpen(Boolean(entry?.bedTime || entry?.wakeTime));
    const timer = window.setTimeout(() => hoursRef.current?.focus(), 220);
    return () => window.clearTimeout(timer);
  }, [open, entry]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (
        (key === "bedTime" || key === "wakeTime") &&
        next.bedTime &&
        next.wakeTime &&
        !current.durationHours &&
        !current.durationMinutes
      ) {
        const computed = durationFromBedWake(next.bedTime, next.wakeTime);
        if (computed !== null) {
          next.durationHours = String(Math.floor(computed / 60));
          next.durationMinutes = String(computed % 60);
        }
      }

      return next;
    });
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function handleSave() {
    const result = SleepService.validate(form);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.entryDate || result.errors.entryTime) {
        setWhenOpen(true);
      }
      return;
    }

    setSaving(true);
    if (isEdit && entry) {
      SleepService.update(entry.id, result.value);
      onSaved("edit");
    } else {
      SleepService.create(result.value);
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
      title={isEdit ? "Editar sueño" : "Registrar sueño"}
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
          ref={hoursRef}
          label="Horas"
          unit="h"
          inputMode="numeric"
          enterKeyHint="next"
          placeholder="7"
          value={form.durationHours}
          error={errors.durationHours}
          onClear={() => updateField("durationHours", "")}
          onChange={(event) =>
            updateField("durationHours", sanitizeIntegerInput(event.target.value))
          }
        />
        <NumberInput
          label="Minutos"
          unit="min"
          inputMode="numeric"
          enterKeyHint="next"
          placeholder="18"
          value={form.durationMinutes}
          error={errors.durationMinutes}
          onClear={() => updateField("durationMinutes", "")}
          onChange={(event) =>
            updateField(
              "durationMinutes",
              sanitizeIntegerInput(event.target.value),
            )
          }
        />
      </div>

      <NumberInput
        label="Puntuación"
        unit="pts"
        inputMode="numeric"
        enterKeyHint="done"
        placeholder="Opcional"
        value={form.score}
        error={errors.score}
        onClear={() => updateField("score", "")}
        onChange={(event) =>
          updateField("score", sanitizeIntegerInput(event.target.value))
        }
      />

      <div>
        {!scheduleOpen ? (
          <button
            type="button"
            onClick={() => setScheduleOpen(true)}
            className="text-[13px] font-medium text-text-muted transition-colors hover:text-text-secondary"
          >
            + Añadir hora de acostarse y despertar
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <FieldInput
              label="Acostarse"
              type="time"
              value={form.bedTime}
              error={errors.bedTime}
              onChange={(event) => updateField("bedTime", event.target.value)}
            />
            <FieldInput
              label="Despertar"
              type="time"
              value={form.wakeTime}
              error={errors.wakeTime}
              onChange={(event) => updateField("wakeTime", event.target.value)}
            />
          </div>
        )}
      </div>
    </RecordBottomSheet>
  );
}
