"use client";

import {
  ChevronRight,
  Footprints,
  HeartPulse,
  Dumbbell,
  Moon,
  Plus,
  Ruler,
  Scale,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";
import type {
  CalendarModuleKey,
  CalendarModuleOpenIntent,
  DaySummaryBlock,
  SelectedDayHeading,
} from "@/features/calendar";

const MODULE_ICON: Record<CalendarModuleKey, LucideIcon> = {
  weight: Scale,
  bloodPressure: HeartPulse,
  sleep: Moon,
  steps: Footprints,
  measurements: Ruler,
  training: Dumbbell,
};

type DaySummaryPanelProps = {
  date: string;
  heading: SelectedDayHeading;
  blocks: DaySummaryBlock[];
  onOpenModule: (intent: CalendarModuleOpenIntent) => void;
};

function ModuleIconWell({
  icon: Icon,
  recorded,
}: {
  icon: LucideIcon;
  recorded: boolean;
}) {
  return (
    <span
      className={cn(
        "flex size-[28px] shrink-0 items-center justify-center rounded-[9px]",
        recorded
          ? "bg-primary-soft text-text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]"
          : "bg-surface-secondary/90 text-text-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]",
      )}
      aria-hidden
    >
      <Icon size={14} strokeWidth={2.1} />
    </span>
  );
}

function RegisterCapsule() {
  return (
    <span
      className={cn(
        "mt-auto inline-flex w-fit items-center gap-[4px]",
        "rounded-full bg-surface-secondary/90 px-[10px] py-[5px]",
        "ring-1 ring-black/[0.04]",
        "text-[11px] font-semibold tracking-title text-text-primary",
        "transition-[background-color] duration-[var(--traza-duration-fast)]",
        "group-hover:bg-primary-soft/80",
      )}
    >
      <Plus size={11} strokeWidth={2.4} aria-hidden />
      <span>Registrar</span>
      <ChevronRight size={11} strokeWidth={2.4} className="text-text-muted" aria-hidden />
    </span>
  );
}

function BlockBody({ block }: { block: DaySummaryBlock }) {
  if (!block.recorded || !block.primary) {
    return <RegisterCapsule />;
  }

  // Measurements: single dense value line (waist · arm · leg)
  if (block.module === "measurements") {
    return (
      <span className="mt-[6px] block min-w-0 text-[15px] font-bold leading-snug tracking-[-0.02em] text-text-primary tabular-nums">
        {block.primary}
      </span>
    );
  }

  return (
    <div className="mt-[6px] flex min-w-0 flex-col gap-[2px]">
      <span className="min-w-0 truncate text-[16px] font-bold leading-none tracking-[-0.02em] text-text-primary tabular-nums">
        {block.primary}
      </span>
      {block.secondary ? (
        <span className="min-w-0 truncate text-[12px] font-medium leading-snug text-text-secondary tabular-nums">
          {block.secondary}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Protagonist of the calendar screen — premium day memory as a 2-column card grid.
 * Each card is a full press target (future module morph / deep-link).
 */
export function DaySummaryPanel({
  date,
  heading,
  blocks,
  onOpenModule,
}: DaySummaryPanelProps) {
  const ariaHeading = `${heading.weekday}, ${heading.dateLabel}`;

  return (
    <section aria-label={`Resumen del ${ariaHeading}`} className="min-w-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={date}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{
            duration: motionDuration.normal,
            ease: motionEase.standard,
          }}
        >
          <header className="mb-3 flex flex-col gap-[5px]">
            <p className="text-[15px] font-semibold leading-none tracking-title text-text-secondary">
              {heading.weekday}
            </p>
            <h2 className="text-[22px] font-bold leading-none tracking-title text-text-primary">
              {heading.dateLabel}
            </h2>
          </header>

          <ul className="grid grid-cols-2 gap-[9px]">
            {blocks.map((block) => {
              const Icon = MODULE_ICON[block.module];
              const ariaValue = block.recorded
                ? [block.primary, block.secondary].filter(Boolean).join(", ")
                : "Registrar";

              return (
                <li key={block.module} className="min-w-0">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.975, opacity: 0.92 }}
                    transition={{
                      duration: motionDuration.fast,
                      ease: motionEase.standard,
                    }}
                    onClick={() =>
                      onOpenModule({
                        date,
                        module: block.module,
                        href: block.href,
                      })
                    }
                    data-module={block.module}
                    aria-label={`${block.label}: ${ariaValue}`}
                    className={cn(
                      "group relative flex h-full min-h-[84px] w-full min-w-0 flex-col overflow-hidden",
                      "rounded-[18px] px-[13px] py-[12px] text-left",
                      "bg-[linear-gradient(165deg,color-mix(in_srgb,var(--traza-primary-soft)_42%,white)_0%,var(--traza-surface)_48%,var(--traza-surface)_100%)]",
                      "shadow-[0_1px_2px_rgba(20,23,20,0.04),0_4px_12px_rgba(20,23,20,0.03)]",
                      "ring-1 ring-black/[0.035]",
                      "transition-[box-shadow,ring-color] duration-[var(--traza-duration-fast)]",
                      "hover:shadow-[0_2px_4px_rgba(20,23,20,0.05),0_6px_16px_rgba(20,23,20,0.04)]",
                      "hover:ring-black/[0.05]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    {/* Soft top illumination */}
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -right-6 -top-8 size-20 rounded-full bg-primary/10 blur-2xl"
                    />

                    <div className="relative flex w-full items-center gap-[7px]">
                      <ModuleIconWell icon={Icon} recorded={block.recorded} />
                      <span className="min-w-0 flex-1 text-[10px] font-semibold leading-none tracking-[0.04em] text-text-muted uppercase">
                        {block.label}
                      </span>
                    </div>

                    <div className="relative mt-auto flex min-h-0 flex-1 flex-col justify-end pt-[8px]">
                      <BlockBody block={block} />
                    </div>
                  </motion.button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
