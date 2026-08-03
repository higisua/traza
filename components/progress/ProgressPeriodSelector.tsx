"use client";

import { motion } from "framer-motion";
import type { AnalyticsPeriod } from "@/features/analytics";
import { PERIOD_OPTIONS } from "@/features/progress";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ProgressPeriodSelectorProps = {
  period: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
};

export function ProgressPeriodSelector({
  period,
  onChange,
}: ProgressPeriodSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="Periodo de progreso"
      className="flex gap-1 rounded-[14px] bg-surface-secondary/90 p-1 ring-1 ring-black/[0.03]"
    >
      {PERIOD_OPTIONS.map((option) => {
        const active = option.value === period;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative flex h-[36px] min-w-0 flex-1 items-center justify-center",
              "rounded-[10px] text-[13px] font-semibold tracking-[-0.01em]",
              "transition-colors duration-[var(--traza-duration-fast)]",
              active ? "text-text-primary" : "text-text-muted hover:text-text-secondary",
            )}
          >
            {active ? (
              <motion.span
                layoutId="progress-period-pill"
                className="absolute inset-0 rounded-[10px] bg-surface shadow-s ring-1 ring-black/[0.04]"
                transition={{ duration: motionDuration.fast, ease: motionEase.standard }}
              />
            ) : null}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
