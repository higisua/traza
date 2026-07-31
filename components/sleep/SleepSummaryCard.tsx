"use client";

import { motion } from "framer-motion";
import type { SleepSummary } from "@/features/sleep";
import {
  formatSleepDuration,
  formatSleepScore,
} from "@/features/sleep";
import { formatEntryStamp } from "@/lib/tracking/dateTime";
import { cn } from "@/lib/utils/cn";

type SleepSummaryCardProps = {
  summary: SleepSummary;
};

const toneClasses: Record<
  NonNullable<SleepSummary["quality"]>["tone"],
  string
> = {
  excellent: "bg-success/12 text-success",
  good: "bg-primary-soft text-text-primary",
  fair: "bg-warning/12 text-[color-mix(in_srgb,var(--traza-warning)_70%,#141714)]",
  poor: "bg-warning/12 text-[color-mix(in_srgb,var(--traza-warning)_70%,#141714)]",
  neutral: "bg-primary-soft text-text-primary",
};

export function SleepSummaryCard({ summary }: SleepSummaryCardProps) {
  const { latest, quality } = summary;
  if (!latest || !quality) return null;

  const hasSchedule = Boolean(latest.bedTime || latest.wakeTime);

  return (
    <motion.section
      key={latest.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[24px] bg-surface p-5 shadow-m ring-1 ring-black/[0.04]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full bg-primary/20 blur-3xl"
      />

      <div className="relative flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-text-muted uppercase">
          Último descanso
        </p>
        <p className="text-[12px] font-medium text-text-muted">
          {formatEntryStamp(latest)}
        </p>
      </div>

      {/* 1. Duration */}
      <div className="relative mt-3">
        <motion.p
          key={latest.durationMinutes}
          initial={{ opacity: 0.5, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="text-[42px] font-bold leading-none tracking-[-0.035em] text-text-primary tabular-nums"
        >
          {formatSleepDuration(latest.durationMinutes)}
        </motion.p>
      </div>

      {/* 2. Quality */}
      <div className="relative mt-3">
        <span
          className={cn(
            "inline-flex rounded-full px-3 py-1 text-[13px] font-semibold tracking-[-0.01em]",
            toneClasses[quality.tone],
          )}
        >
          {quality.label}
        </span>
      </div>

      {/* 3. Score — only if present */}
      {latest.score !== null ? (
        <p className="relative mt-3 text-[16px] font-semibold tabular-nums text-text-secondary">
          {formatSleepScore(latest.score)}
        </p>
      ) : null}

      {/* 4. Schedule — only if present */}
      {hasSchedule ? (
        <p className="relative mt-3 text-[12px] font-medium text-text-muted">
          {[
            latest.bedTime ? `Acostarse ${latest.bedTime}` : null,
            latest.wakeTime ? `Despertar ${latest.wakeTime}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </motion.section>
  );
}
