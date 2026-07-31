"use client";

import type { MonthCell } from "@/features/calendar";
import { DayCell } from "./DayCell";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"] as const;

type MonthGridProps = {
  cells: MonthCell[];
  selectedDate: string | null;
  onSelectCell: (date: string, inCurrentMonth: boolean) => void;
};

export function MonthGrid({
  cells,
  selectedDate,
  onSelectCell,
}: MonthGridProps) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[16px] bg-surface/90 px-[7px] py-[7px] shadow-xs ring-1 ring-black/[0.025]">
      <div
        className="mb-[2px] grid grid-cols-[repeat(7,minmax(0,1fr))] gap-0"
        role="row"
        aria-hidden
      >
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className="flex h-[16px] items-center justify-center text-[9px] font-semibold tracking-[0.08em] text-text-muted uppercase"
          >
            {label}
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-[2px]"
        role="grid"
        aria-label="Calendario mensual"
      >
        {cells.map((cell) => (
          <DayCell
            key={cell.date}
            cell={cell}
            selected={selectedDate === cell.date}
            onSelect={onSelectCell}
          />
        ))}
      </div>
    </div>
  );
}
