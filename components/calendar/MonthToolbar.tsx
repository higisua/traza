"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type MonthToolbarProps = {
  monthLabel: string;
  isCurrentMonthVisible: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
};

function NavIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      transition={{ duration: motionDuration.fast, ease: motionEase.standard }}
      className={cn(
        // Explicit px — size-11 maps to 128px in TRAZA tokens.
        "flex size-[32px] shrink-0 items-center justify-center rounded-[10px]",
        "text-text-secondary",
        "transition-colors duration-[var(--traza-duration-fast)]",
        "hover:bg-surface-secondary/70 hover:text-text-primary",
      )}
    >
      {children}
    </motion.button>
  );
}

/**
 * Compact month navigator — prev/next flanking the label.
 * "Hoy" only appears as a small text control when away from the current month.
 */
export function MonthToolbar({
  monthLabel,
  isCurrentMonthVisible,
  onPrev,
  onNext,
  onToday,
}: MonthToolbarProps) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <NavIconButton label="Mes anterior" onClick={onPrev}>
        <ChevronLeft size={16} strokeWidth={2} />
      </NavIconButton>

      <div className="relative flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={monthLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{
              duration: motionDuration.normal,
              ease: motionEase.standard,
            }}
            className="truncate text-center text-[15px] font-semibold leading-none tracking-title text-text-primary"
            aria-live="polite"
          >
            {monthLabel}
          </motion.p>
        </AnimatePresence>

        {!isCurrentMonthVisible ? (
          <motion.button
            type="button"
            onClick={onToday}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.96 }}
            transition={{
              duration: motionDuration.fast,
              ease: motionEase.standard,
            }}
            className={cn(
              "shrink-0 rounded-[8px] px-[8px] py-[4px]",
              "text-[11px] font-semibold tracking-title text-text-primary",
              "bg-primary-soft ring-1 ring-primary/30",
            )}
          >
            Hoy
          </motion.button>
        ) : null}
      </div>

      <NavIconButton label="Mes siguiente" onClick={onNext}>
        <ChevronRight size={16} strokeWidth={2} />
      </NavIconButton>
    </div>
  );
}
