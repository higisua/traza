"use client";

import { motion } from "framer-motion";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";
import type { MonthCell } from "@/features/calendar";
import { DayPresenceMarks } from "./DayPresenceMarks";

type DayCellProps = {
  cell: MonthCell;
  selected: boolean;
  onSelect: (date: string, inCurrentMonth: boolean) => void;
};

export function DayCell({ cell, selected, onSelect }: DayCellProps) {
  const { date, dayOfMonth, inCurrentMonth, isToday, presence } = cell;
  const hasPresence = presence.modules.length > 0;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(date, inCurrentMonth)}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: motionDuration.fast, ease: motionEase.standard }}
      aria-label={`${dayOfMonth}${hasPresence ? `, con registros` : ""}`}
      aria-pressed={selected}
      aria-current={isToday ? "date" : undefined}
      className={cn(
        // Navigator presence +~12%: still compact; summary remains protagonist.
        "relative flex min-h-[39px] min-w-0 w-full flex-col items-center justify-center gap-[3px] rounded-[9px] py-[3px]",
        "transition-[background-color,box-shadow,color,border-color] duration-[var(--traza-duration-fast)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !inCurrentMonth && "opacity-35",
        selected
          ? [
              "bg-[color-mix(in_srgb,var(--traza-primary-soft)_88%,white)]",
              "text-text-primary",
              "border border-primary/55",
              "shadow-[0_1px_2px_rgba(20,23,20,0.05),0_2px_6px_rgba(199,244,61,0.18)]",
            ]
          : isToday
            ? "border border-primary/30 text-text-primary"
            : "border border-transparent text-text-primary hover:bg-surface-secondary/60",
      )}
    >
      <span
        className={cn(
          "text-[12px] font-semibold tabular-nums leading-none tracking-title",
          selected && "text-text-primary",
          !selected && isToday && "font-bold",
          !selected && !inCurrentMonth && "text-text-muted",
        )}
      >
        {dayOfMonth}
      </span>

      <DayPresenceMarks modules={presence.modules} selected={selected} />
    </motion.button>
  );
}
