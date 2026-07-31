"use client";

import { cn } from "@/lib/utils/cn";
import {
  CALENDAR_MODULES,
  type CalendarModuleKey,
} from "@/features/calendar";

const MODULE_LABEL: Record<CalendarModuleKey, string> = {
  weight: "peso",
  bloodPressure: "tensión",
  sleep: "sueño",
  steps: "pasos",
  measurements: "medidas",
  training: "entrenamiento",
};

type DayPresenceMarksProps = {
  modules: readonly CalendarModuleKey[];
  selected?: boolean;
  className?: string;
};

/**
 * Fixed 6-slot presence map — same order every day, aligned across the grid.
 * Filled = has data (●); empty = no data (○). No icons, text, or numbers.
 */
export function DayPresenceMarks({
  modules,
  selected = false,
  className,
}: DayPresenceMarksProps) {
  const present = new Set(modules);
  const labels = modules.map((m) => MODULE_LABEL[m]).join(", ");

  return (
    <span
      className={cn(
        "flex h-[8px] w-full max-w-[52px] items-center justify-center gap-[3px]",
        className,
      )}
      aria-label={
        modules.length > 0 ? `Registros: ${labels}` : "Sin registros"
      }
    >
      {CALENDAR_MODULES.map((module) => {
        const on = present.has(module);
        return (
          <span
            key={module}
            className={cn(
              // Explicit px — hollow ○ vs filled ●, same footprint every day.
              "box-border size-[5px] shrink-0 rounded-full",
              "transition-[background-color,border-color,opacity] duration-[var(--traza-duration-fast)]",
              on
                ? selected
                  ? "border border-primary bg-primary"
                  : module === "training"
                    ? "border border-primary bg-primary"
                    : "border border-text-primary/55 bg-text-primary/55"
                : selected
                  ? "border border-primary/35 bg-transparent"
                  : "border border-text-muted/40 bg-transparent",
            )}
            aria-hidden
          />
        );
      })}
    </span>
  );
}
