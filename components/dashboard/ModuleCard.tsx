"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { listItemVariants, motionDuration, motionEase } from "@/lib/motion";
import { cn } from "@/lib/utils/cn";

type ModuleCardProps = {
  icon: LucideIcon;
  label: string;
  /** Dominant figure without unit, e.g. "95,45" */
  primary: string;
  primaryUnit?: string;
  secondary?: string;
  meta: string;
  index?: number;
  onClick?: () => void;
  className?: string;
};

/**
 * Tracking-module summary card.
 * Visual weight must communicate that each card is a full product area.
 */
export function ModuleCard({
  icon: Icon,
  label,
  primary,
  primaryUnit,
  secondary,
  meta,
  index = 0,
  onClick,
  className,
}: ModuleCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      custom={index}
      variants={listItemVariants}
      initial={false}
      animate="visible"
      whileHover={{ y: -2, transition: { duration: motionDuration.fast } }}
      whileTap={{
        scale: 0.985,
        transition: { duration: motionDuration.fast, ease: motionEase.standard },
      }}
      className={cn(
        "group relative flex min-h-[132px] flex-col overflow-hidden",
        "rounded-[20px] bg-surface p-4 text-left shadow-s",
        "ring-1 ring-black/[0.03]",
        "transition-[box-shadow] duration-[var(--traza-duration-normal)]",
        "hover:shadow-m",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-primary/15 blur-2xl transition-opacity duration-[var(--traza-duration-normal)] group-hover:bg-primary/25"
      />

      <div className="relative flex w-full items-center justify-between gap-2">
        <span className="text-label font-medium tracking-label text-text-muted uppercase">
          {label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary-soft text-text-primary">
          <Icon size={16} strokeWidth={2.25} aria-hidden />
        </span>
      </div>

      <div className="relative mt-4 flex min-w-0 items-baseline gap-1.5">
        <span className="text-hero-number font-bold leading-display tracking-display text-text-primary tabular-nums">
          {primary}
        </span>
        {primaryUnit ? (
          <span className="text-caption font-semibold text-text-muted">
            {primaryUnit}
          </span>
        ) : null}
      </div>

      {secondary ? (
        <p className="relative mt-1.5 text-caption font-medium text-text-secondary tabular-nums">
          {secondary}
        </p>
      ) : (
        <div className="relative mt-1.5 h-[17px]" aria-hidden />
      )}

      <div className="relative mt-auto flex items-center gap-2 pt-3">
        <span
          aria-hidden
          className="size-1.5 rounded-full bg-primary"
        />
        <p className="text-label font-medium tracking-label text-text-muted uppercase">
          {meta}
        </p>
      </div>
    </motion.button>
  );
}
