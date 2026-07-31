"use client";

import { motion } from "framer-motion";
import type { BloodPressureSummary } from "@/features/blood-pressure";
import {
  formatBloodPressureReading,
  formatPulse,
} from "@/features/blood-pressure";
import { formatEntryStamp } from "@/lib/tracking/dateTime";
import { cn } from "@/lib/utils/cn";

type BloodPressureSummaryCardProps = {
  summary: BloodPressureSummary;
};

const toneClasses: Record<
  NonNullable<BloodPressureSummary["category"]>["tone"],
  string
> = {
  optimal: "bg-success/12 text-success",
  normal: "bg-primary-soft text-text-primary",
  caution: "bg-warning/15 text-[color-mix(in_srgb,var(--traza-warning)_75%,#141714)]",
  elevated: "bg-warning/20 text-[color-mix(in_srgb,var(--traza-warning)_85%,#141714)]",
  high: "bg-danger/12 text-danger",
  critical: "bg-danger/18 text-danger",
};

export function BloodPressureSummaryCard({
  summary,
}: BloodPressureSummaryCardProps) {
  const { latest, category } = summary;
  if (!latest || !category) return null;

  return (
    <motion.section
      key={latest.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-surface p-5 shadow-m ring-1 ring-black/[0.04]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/18 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
          Estado
        </p>
        <p className="text-[12px] font-medium text-text-muted">
          {formatEntryStamp(latest)}
        </p>
      </div>

      <div className="relative mt-4">
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-[13px] font-semibold tracking-[-0.01em]",
            toneClasses[category.tone],
          )}
        >
          {category.label}
        </span>
      </div>

      <div className="relative mt-4 flex items-baseline gap-1.5">
        <motion.span
          key={`${latest.systolic}-${latest.diastolic}`}
          initial={{ opacity: 0.55, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[42px] font-bold leading-none tracking-[-0.035em] text-text-primary tabular-nums"
        >
          {formatBloodPressureReading(latest.systolic, latest.diastolic)}
        </motion.span>
      </div>

      <p className="relative mt-3 text-[16px] font-semibold tabular-nums text-text-secondary">
        {formatPulse(latest.pulse)}
      </p>

      <p className="relative mt-3 text-[12px] font-medium leading-snug text-text-muted">
        Clasificación orientativa según rangos ESC/ESH. No es un diagnóstico.
      </p>
    </motion.section>
  );
}
