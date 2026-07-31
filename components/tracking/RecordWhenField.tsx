"use client";

import { ChevronDown } from "lucide-react";
import { FieldInput } from "@/components/forms/FieldInput";
import { formatDateTimeChip } from "@/lib/tracking/dateTime";
import { cn } from "@/lib/utils/cn";

type RecordWhenFieldProps = {
  entryDate: string;
  entryTime: string;
  open: boolean;
  onToggle: () => void;
  onDateChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  dateError?: string;
  timeError?: string;
};

export function RecordWhenField({
  entryDate,
  entryTime,
  open,
  onToggle,
  onDateChange,
  onTimeChange,
  dateError,
  timeError,
}: RecordWhenFieldProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
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
            {formatDateTimeChip(entryDate, entryTime)}
          </p>
        </div>
        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className={cn(
            "text-text-muted transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <FieldInput
            label="Fecha"
            type="date"
            value={entryDate}
            error={dateError}
            onChange={(event) => onDateChange(event.target.value)}
          />
          <FieldInput
            label="Hora"
            type="time"
            value={entryTime}
            error={timeError}
            onChange={(event) => onTimeChange(event.target.value)}
          />
        </div>
      ) : dateError || timeError ? (
        <p className="mt-2 text-caption text-danger">
          {dateError ?? timeError}
        </p>
      ) : null}
    </div>
  );
}
